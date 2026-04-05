namespace MunicipalOS.Application.Common.Interfaces;

public interface IMunicipalityRepository
{
    Task<IReadOnlyList<Municipality>> GetAllAsync(CancellationToken ct = default);
    Task<Municipality?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<bool> ExistsByNameAsync(string name, CancellationToken ct = default);
    Task<bool> ExistsByShortNameAsync(string shortName, CancellationToken ct = default);
    Task<Municipality> AddAsync(Municipality municipality, CancellationToken ct = default);
}
