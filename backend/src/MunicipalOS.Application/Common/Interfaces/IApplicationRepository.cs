namespace MunicipalOS.Application.Common.Interfaces;

public interface IApplicationRepository
{
    Task<DomainApplication?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<DomainApplication>> GetByCitizenIdAsync(Guid citizenId, CancellationToken ct = default);
    Task<IReadOnlyList<DomainApplication>> GetActiveByMunicipalityAsync(Guid municipalityId, CancellationToken ct = default);
    Task<IReadOnlyList<DomainApplication>> GetActiveAssignedToOfficerAsync(
        Guid officerId, Guid municipalityId, CancellationToken ct = default);
    Task<DomainApplication> AddAsync(DomainApplication application, CancellationToken ct = default);
    Task UpdateAsync(DomainApplication application, CancellationToken ct = default);
    Task AddDocumentAsync(ApplicationDocument document, CancellationToken ct = default);
}
