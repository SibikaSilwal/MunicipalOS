using MunicipalOS.Application.Common.Models;

namespace MunicipalOS.Application.Common.Interfaces;

public interface IApplicationRepository
{
    Task<DomainApplication?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<DomainApplication>> GetByCitizenIdAsync(Guid citizenId, CancellationToken ct = default);
    Task<IReadOnlyList<DomainApplication>> GetActiveByMunicipalityAsync(Guid municipalityId, CancellationToken ct = default);
    /// <summary>Approved or rejected applications for the municipality (newest first).</summary>
    Task<IReadOnlyList<DomainApplication>> GetTerminalByMunicipalityAsync(Guid municipalityId, CancellationToken ct = default);
    /// <summary>Every application for the municipality (all statuses, newest submitted first).</summary>
    Task<IReadOnlyList<DomainApplication>> GetAllByMunicipalityAsync(Guid municipalityId, CancellationToken ct = default);
    Task<IReadOnlyList<DomainApplication>> GetActiveAssignedToOfficerAsync(
        Guid officerId, Guid municipalityId, CancellationToken ct = default);
    Task<SlaMetricsSnapshot> GetSlaMetricsAsync(
        Guid municipalityId,
        DateTime fromUtc,
        DateTime toUtc,
        Guid? serviceTypeId,
        bool includeRejected,
        CancellationToken ct = default);

    Task<IReadOnlyList<SlaServiceBreakdownRow>> GetSlaBreakdownByServiceAsync(
        Guid municipalityId,
        DateTime fromUtc,
        DateTime toUtc,
        Guid? serviceTypeId,
        bool includeRejected,
        CancellationToken ct = default);

    Task<IReadOnlyList<SlaOfficerBreakdownRow>> GetSlaBreakdownByTerminalOfficerAsync(
        Guid municipalityId,
        DateTime fromUtc,
        DateTime toUtc,
        Guid? serviceTypeId,
        bool includeRejected,
        CancellationToken ct = default);

    Task<PagedResult<SlaApplicationReportRow>> GetSlaApplicationRowsAsync(
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
        CancellationToken ct = default);

    Task<bool> ExistsForServiceTypeAsync(Guid serviceTypeId, CancellationToken ct = default);
    Task<bool> FriendlyApplicationIdExistsAsync(string friendlyApplicationId, CancellationToken ct = default);

    Task<DomainApplication> AddAsync(DomainApplication application, CancellationToken ct = default);
    Task UpdateAsync(DomainApplication application, CancellationToken ct = default);
    Task AddDocumentAsync(ApplicationDocument document, CancellationToken ct = default);
}
