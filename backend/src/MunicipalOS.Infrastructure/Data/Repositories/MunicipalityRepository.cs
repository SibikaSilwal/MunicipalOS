using Microsoft.EntityFrameworkCore;
using MunicipalOS.Application.Common.Interfaces;

namespace MunicipalOS.Infrastructure.Data.Repositories;

public class MunicipalityRepository : IMunicipalityRepository
{
    private readonly AppDbContext _db;

    public MunicipalityRepository(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<Municipality>> GetAllAsync(CancellationToken ct = default)
        => await _db.Municipalities.AsNoTracking().OrderBy(m => m.Name).ToListAsync(ct);

    public async Task<Municipality?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await _db.Municipalities.AsNoTracking().FirstOrDefaultAsync(m => m.Id == id, ct);

    public async Task<bool> ExistsByNameAsync(string name, CancellationToken ct = default)
        => await _db.Municipalities.AsNoTracking().AnyAsync(m => m.Name.ToLower() == name.ToLower(), ct);

    public async Task<Municipality> AddAsync(Municipality municipality, CancellationToken ct = default)
    {
        _db.Municipalities.Add(municipality);
        await _db.SaveChangesAsync(ct);
        return municipality;
    }
}
