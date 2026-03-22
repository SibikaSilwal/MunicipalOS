using Microsoft.EntityFrameworkCore;
using MunicipalOS.Application.Common.Interfaces;

namespace MunicipalOS.Infrastructure.Data.Repositories;

public class ServiceTypeRepository : IServiceTypeRepository
{
    private readonly AppDbContext _db;

    public ServiceTypeRepository(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<ServiceType>> GetByMunicipalityIdAsync(Guid municipalityId, CancellationToken ct = default)
        => await _db.ServiceTypes
            .AsNoTracking()
            .Include(s => s.RequiredDocuments)
            .Where(s => s.MunicipalityId == municipalityId)
            .OrderBy(s => s.Name)
            .ToListAsync(ct);

    public async Task<ServiceType?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await _db.ServiceTypes
            .AsNoTracking()
            .Include(s => s.RequiredDocuments)
            .FirstOrDefaultAsync(s => s.Id == id, ct);

    public async Task<ServiceType> AddAsync(ServiceType serviceType, CancellationToken ct = default)
    {
        _db.ServiceTypes.Add(serviceType);
        await _db.SaveChangesAsync(ct);
        return serviceType;
    }

    public async Task UpdateAsync(ServiceType serviceType, CancellationToken ct = default)
    {
        _db.ServiceTypes.Update(serviceType);
        await _db.SaveChangesAsync(ct);
    }
}
