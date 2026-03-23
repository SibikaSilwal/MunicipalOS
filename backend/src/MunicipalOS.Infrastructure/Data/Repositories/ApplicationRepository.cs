using Microsoft.EntityFrameworkCore;
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
