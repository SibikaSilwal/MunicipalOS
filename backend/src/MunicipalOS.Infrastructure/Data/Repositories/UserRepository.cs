using Microsoft.EntityFrameworkCore;
using MunicipalOS.Application.Common.Interfaces;
using MunicipalOS.Domain.Enums;

namespace MunicipalOS.Infrastructure.Data.Repositories;

public class UserRepository : IUserRepository
{
    private readonly AppDbContext _db;

    public UserRepository(AppDbContext db) => _db = db;

    public async Task<User?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await _db.Users
            .AsNoTracking()
            .Include(u => u.Role)
            .Include(u => u.Municipality)
            .FirstOrDefaultAsync(u => u.Id == id, ct);

    public async Task<User?> GetByEmailAsync(string email, CancellationToken ct = default)
        => await _db.Users
            .AsNoTracking()
            .Include(u => u.Role)
            .Include(u => u.Municipality)
            .FirstOrDefaultAsync(u => u.Email == email, ct);

    public async Task<IReadOnlyList<User>> GetOfficersByMunicipalityIdAsync(
        Guid municipalityId, CancellationToken ct = default)
    {
        var citizenRoleName = nameof(RoleName.Citizen);
        return await _db.Users
            .AsNoTracking()
            .Include(u => u.Role)
            .Where(u => u.MunicipalityId == municipalityId && u.Role.Name != citizenRoleName)
            .OrderBy(u => u.FullName)
            .ToListAsync(ct);
    }

    public async Task<User> AddAsync(User user, CancellationToken ct = default)
    {
        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);
        return user;
    }

    public async Task UpdateAsync(User user, CancellationToken ct = default)
    {
        _db.Users.Update(user);
        await _db.SaveChangesAsync(ct);
    }
}
