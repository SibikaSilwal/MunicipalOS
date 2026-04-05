using Microsoft.EntityFrameworkCore;
using MunicipalOS.Application.Common.Models;
using MunicipalOS.Application.Common.Interfaces;
using MunicipalOS.Domain.Enums;

namespace MunicipalOS.Infrastructure.Data.Repositories;

public class ApplicationRepository : IApplicationRepository
{
    private readonly AppDbContext _db;

    public ApplicationRepository(AppDbContext db) => _db = db;

    public async Task<DomainApplication?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await _db.Applications
            .Include(a => a.Citizen)
            .Include(a => a.ServiceType)
            .Include(a => a.Documents)
            .Include(a => a.StatusHistory)
            .Include(a => a.WorkflowSteps.OrderBy(s => s.StepOrder))
                .ThenInclude(s => s.WorkflowStep)
            .Include(a => a.WorkflowSteps)
                .ThenInclude(s => s.AssignedToUser)
            .Include(a => a.WorkflowSteps)
                .ThenInclude(s => s.CompletedByUser)
            .FirstOrDefaultAsync(a => a.Id == id, ct);

    public async Task<IReadOnlyList<DomainApplication>> GetByCitizenIdAsync(Guid citizenId, CancellationToken ct = default)
        => await _db.Applications
            .AsNoTracking()
            .Include(a => a.ServiceType)
            .Include(a => a.StatusHistory)
            .Where(a => a.CitizenId == citizenId)
            .OrderByDescending(a => a.SubmittedAt)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<DomainApplication>> GetActiveByMunicipalityAsync(
        Guid municipalityId, CancellationToken ct = default)
        => await _db.Applications
            .AsNoTracking()
            .Include(a => a.Citizen)
            .Include(a => a.ServiceType)
            .Where(a => a.ServiceType.MunicipalityId == municipalityId
                && a.Status != Domain.Enums.ApplicationStatus.Approved
                && a.Status != Domain.Enums.ApplicationStatus.Rejected)
            .OrderBy(a => a.SubmittedAt)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<DomainApplication>> GetTerminalByMunicipalityAsync(
        Guid municipalityId, CancellationToken ct = default)
        => await _db.Applications
            .AsNoTracking()
            .Include(a => a.ServiceType)
            .Where(a => a.ServiceType.MunicipalityId == municipalityId
                && (a.Status == ApplicationStatus.Approved || a.Status == ApplicationStatus.Rejected))
            .OrderByDescending(a => a.SubmittedAt)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<DomainApplication>> GetAllByMunicipalityAsync(
        Guid municipalityId, CancellationToken ct = default)
        => await _db.Applications
            .AsNoTracking()
            .Include(a => a.ServiceType)
            .Where(a => a.ServiceType.MunicipalityId == municipalityId)
            .OrderByDescending(a => a.SubmittedAt)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<DomainApplication>> GetActiveAssignedToOfficerAsync(
        Guid officerId, Guid municipalityId, CancellationToken ct = default)
    {
        var apps = await _db.Applications
            .AsNoTracking()
            .Include(a => a.Citizen)
            .Include(a => a.ServiceType)
            .Include(a => a.WorkflowSteps)
            .Where(a => a.ServiceType.MunicipalityId == municipalityId
                && a.Status != Domain.Enums.ApplicationStatus.Approved
                && a.Status != Domain.Enums.ApplicationStatus.Rejected)
            .OrderBy(a => a.SubmittedAt)
            .ToListAsync(ct);

        return apps
            .Where(a =>
            {
                var current = a.WorkflowSteps
                    .Where(s => s.Status != ApplicationStepStatus.Completed)
                    .OrderBy(s => s.StepOrder)
                    .FirstOrDefault();
                return current?.AssignedToUserId == officerId;
            })
            .ToList();
    }

    public async Task<SlaMetricsSnapshot> GetSlaMetricsAsync(
        Guid municipalityId,
        DateTime fromUtc,
        DateTime toUtc,
        Guid? serviceTypeId,
        bool includeRejected,
        CancellationToken ct = default)
    {
        var q = BuildCompletedSlaRowsQuery(
            municipalityId, fromUtc, toUtc, serviceTypeId, includeRejected);

        var totalCompleted = await q.CountAsync(ct);
        if (totalCompleted == 0)
        {
            return new SlaMetricsSnapshot(0, 0, 0, 0);
        }

        var completedWithinSla = await q.CountAsync(x => x.CompletedAt <= x.DueAt, ct);
        var breached = totalCompleted - completedWithinSla;
        var percentCompletedWithinSla = Math.Round((double)completedWithinSla / totalCompleted * 100, 2);

        return new SlaMetricsSnapshot(totalCompleted, completedWithinSla, breached, percentCompletedWithinSla);
    }

    public async Task<IReadOnlyList<SlaServiceBreakdownRow>> GetSlaBreakdownByServiceAsync(
        Guid municipalityId,
        DateTime fromUtc,
        DateTime toUtc,
        Guid? serviceTypeId,
        bool includeRejected,
        CancellationToken ct = default)
    {
        var q = BuildCompletedSlaRowsQuery(
            municipalityId, fromUtc, toUtc, serviceTypeId, includeRejected);

        var grouped = await q
            .GroupBy(x => new { x.ServiceTypeId, x.ServiceTypeName })
            .Select(g => new
            {
                g.Key.ServiceTypeId,
                g.Key.ServiceTypeName,
                TotalCompleted = g.Count(),
                CompletedWithinSla = g.Count(x => x.CompletedAt <= x.DueAt)
            })
            .OrderByDescending(x => x.TotalCompleted)
            .ToListAsync(ct);

        return grouped
            .Select(x =>
            {
                var breached = x.TotalCompleted - x.CompletedWithinSla;
                var pct = x.TotalCompleted == 0
                    ? 0
                    : Math.Round((double)x.CompletedWithinSla / x.TotalCompleted * 100, 2);
                return new SlaServiceBreakdownRow(
                    x.ServiceTypeId,
                    x.ServiceTypeName,
                    x.TotalCompleted,
                    x.CompletedWithinSla,
                    breached,
                    pct);
            })
            .ToList();
    }

    public async Task<IReadOnlyList<SlaOfficerBreakdownRow>> GetSlaBreakdownByTerminalOfficerAsync(
        Guid municipalityId,
        DateTime fromUtc,
        DateTime toUtc,
        Guid? serviceTypeId,
        bool includeRejected,
        CancellationToken ct = default)
    {
        var q = BuildCompletedSlaRowsQuery(
            municipalityId, fromUtc, toUtc, serviceTypeId, includeRejected);

        var grouped = await q
            .GroupBy(x => x.TerminalOfficerId)
            .Select(g => new
            {
                OfficerId = g.Key,
                TotalCompleted = g.Count(),
                CompletedWithinSla = g.Count(x => x.CompletedAt <= x.DueAt)
            })
            .OrderByDescending(x => x.TotalCompleted)
            .ToListAsync(ct);

        var officerIds = grouped
            .Where(x => x.OfficerId.HasValue)
            .Select(x => x.OfficerId!.Value)
            .Distinct()
            .ToList();

        var names = await _db.Users
            .AsNoTracking()
            .Where(u => officerIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.FullName, ct);

        return grouped
            .Select(x =>
            {
                var breached = x.TotalCompleted - x.CompletedWithinSla;
                var pct = x.TotalCompleted == 0
                    ? 0
                    : Math.Round((double)x.CompletedWithinSla / x.TotalCompleted * 100, 2);
                var name = x.OfficerId is { } id && names.TryGetValue(id, out var n)
                    ? n
                    : "Unknown";
                return new SlaOfficerBreakdownRow(
                    x.OfficerId,
                    name,
                    x.TotalCompleted,
                    x.CompletedWithinSla,
                    breached,
                    pct);
            })
            .ToList();
    }

    public async Task<PagedResult<SlaApplicationReportRow>> GetSlaApplicationRowsAsync(
        Guid municipalityId,
        DateTime fromUtc,
        DateTime toUtc,
        Guid? serviceTypeId,
        bool includeRejected,
        int page,
        int pageSize,
        bool withinSlaOnly,
        bool breachedOnly,
        Guid? terminalOfficerId,
        CancellationToken ct = default)
    {
        var q = BuildCompletedSlaRowsQuery(
            municipalityId, fromUtc, toUtc, serviceTypeId, includeRejected);

        if (withinSlaOnly && breachedOnly)
        {
            return new PagedResult<SlaApplicationReportRow>([], 0);
        }

        if (withinSlaOnly)
        {
            q = q.Where(x => x.CompletedAt <= x.DueAt);
        }

        if (breachedOnly)
        {
            q = q.Where(x => x.CompletedAt > x.DueAt);
        }

        if (terminalOfficerId.HasValue)
        {
            var oid = terminalOfficerId.Value;
            q = q.Where(x => x.TerminalOfficerId == oid);
        }

        var total = await q.CountAsync(ct);

        var skip = Math.Max(0, (page - 1) * pageSize);
        var pageRows = await q
            .OrderByDescending(x => x.CompletedAt)
            .Skip(skip)
            .Take(pageSize)
            .ToListAsync(ct);

        var pageAppIds = pageRows.Select(r => r.ApplicationId).Distinct().ToList();
        // Load full rows like GetTerminalByMunicipalityAsync — projection ToDictionary was not reliably binding friendly_application_id.
        var appsForFriendly = pageAppIds.Count == 0
            ? new List<DomainApplication>()
            : await _db.Applications
                .AsNoTracking()
                .Where(a => pageAppIds.Contains(a.Id))
                .ToListAsync(ct);
        var friendlyByAppId = appsForFriendly.ToDictionary(
            a => a.Id,
            a => a.FriendlyApplicationId ?? string.Empty);

        var pageOfficerIds = pageRows
            .Where(x => x.TerminalOfficerId.HasValue)
            .Select(x => x.TerminalOfficerId!.Value)
            .Distinct()
            .ToList();

        var pageNames = await _db.Users
            .AsNoTracking()
            .Where(u => pageOfficerIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.FullName, ct);

        var items = pageRows.Select(row =>
        {
            var within = row.CompletedAt <= row.DueAt;
            string? officerName = null;
            if (row.TerminalOfficerId is { } oid && pageNames.TryGetValue(oid, out var fn))
            {
                officerName = fn;
            }

            int? minutesLate = null;
            if (!within)
            {
                minutesLate = (int)Math.Round((row.CompletedAt - row.DueAt).TotalMinutes);
            }

            var friendlyId = friendlyByAppId.TryGetValue(row.ApplicationId, out var fid)
                ? fid
                : string.Empty;

            return new SlaApplicationReportRow
            {
                ApplicationId = row.ApplicationId,
                FriendlyApplicationId = friendlyId,
                ServiceTypeName = row.ServiceTypeName,
                Status = row.TerminalStatus,
                CompletedAt = row.CompletedAt,
                DueAt = row.DueAt,
                WithinSla = within,
                TerminalOfficerId = row.TerminalOfficerId,
                TerminalOfficerName = officerName,
                MinutesLate = minutesLate,
            };
        }).ToList();

        return new PagedResult<SlaApplicationReportRow>(items, total);
    }

    /// <summary>
    /// Terminal officer: ChangedBy on the latest Approved/Rejected status history entry.
    /// </summary>
    private IQueryable<CompletedSlaQueryRow> BuildCompletedSlaRowsQuery(
        Guid municipalityId,
        DateTime fromUtc,
        DateTime toUtc,
        Guid? serviceTypeId,
        bool includeRejected)
    {
        var terminalStatuses = includeRejected
            ? new ApplicationStatus[] { ApplicationStatus.Approved, ApplicationStatus.Rejected }
            : new ApplicationStatus[] { ApplicationStatus.Approved };

        var terminalStatusStrings = terminalStatuses
            .Select(status => status.ToString())
            .ToArray();

        return _db.Applications
            .AsNoTracking()
            .Where(a => a.ServiceType.MunicipalityId == municipalityId)
            .Where(a => terminalStatuses.Contains(a.Status))
            .Where(a => !serviceTypeId.HasValue || a.ServiceTypeId == serviceTypeId.Value)
            .Where(a => a.DueAt.HasValue)
            .Select(a => new CompletedSlaQueryRow
            {
                ApplicationId = a.Id,
                ServiceTypeId = a.ServiceTypeId,
                ServiceTypeName = a.ServiceType.Name,
                TerminalStatus = a.Status.ToString(),
                DueAt = a.DueAt!.Value,
                CompletedAt = a.StatusHistory
                    .Where(h => terminalStatusStrings.Contains(h.Status))
                    .OrderByDescending(h => h.ChangedAt)
                    .Select(h => h.ChangedAt)
                    .First(),
                TerminalOfficerId = a.StatusHistory
                    .Where(h => terminalStatusStrings.Contains(h.Status))
                    .OrderByDescending(h => h.ChangedAt)
                    .Select(h => (Guid?)h.ChangedBy)
                    .FirstOrDefault()
            })
            .Where(x => x.CompletedAt >= fromUtc && x.CompletedAt <= toUtc);
    }

    private sealed class CompletedSlaQueryRow
    {
        public Guid ApplicationId { get; set; }
        public Guid ServiceTypeId { get; set; }
        public string ServiceTypeName { get; set; } = "";
        public string TerminalStatus { get; set; } = "";
        public DateTime DueAt { get; set; }
        public DateTime CompletedAt { get; set; }
        public Guid? TerminalOfficerId { get; set; }
    }

    public Task<bool> ExistsForServiceTypeAsync(Guid serviceTypeId, CancellationToken ct = default)
        => _db.Applications.AnyAsync(a => a.ServiceTypeId == serviceTypeId, ct);

    public Task<bool> FriendlyApplicationIdExistsAsync(string friendlyApplicationId, CancellationToken ct = default)
        => _db.Applications.AsNoTracking()
            .AnyAsync(a => a.FriendlyApplicationId == friendlyApplicationId, ct);

    public async Task<DomainApplication> AddAsync(DomainApplication application, CancellationToken ct = default)
    {
        _db.Applications.Add(application);
        await _db.SaveChangesAsync(ct);
        return application;
    }

    public async Task UpdateAsync(DomainApplication application, CancellationToken ct = default)
    {
        await _db.SaveChangesAsync(ct);
    }

    public async Task AddDocumentAsync(ApplicationDocument document, CancellationToken ct = default)
    {
        _db.ApplicationDocuments.Add(document);
        await _db.SaveChangesAsync(ct);
    }
}
