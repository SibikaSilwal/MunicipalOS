namespace MunicipalOS.Application.Common.Interfaces;

public interface IServiceTypeRepository
{
    Task<IReadOnlyList<ServiceType>> GetByMunicipalityIdAsync(Guid municipalityId, CancellationToken ct = default);
    Task<ServiceType?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<ServiceType> AddAsync(ServiceType serviceType, CancellationToken ct = default);
    Task UpdateAsync(ServiceType serviceType, CancellationToken ct = default);
}
