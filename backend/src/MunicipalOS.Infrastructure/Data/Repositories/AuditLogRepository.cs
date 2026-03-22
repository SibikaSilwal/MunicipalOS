using Microsoft.EntityFrameworkCore;
using MunicipalOS.Application.Common.Interfaces;

namespace MunicipalOS.Infrastructure.Data.Repositories;

public class AuditLogRepository : IAuditLogRepository
{
    private readonly AppDbContext _db;

    public AuditLogRepository(AppDbContext db) => _db = db;

    public async Task AddAsync(AuditLog log, CancellationToken ct = default)
    {
        _db.AuditLogs.Add(log);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<AuditLog>> QueryAsync(
        Guid? userId = null,
        Guid? applicationId = null,
        string? eventType = null,
        DateTime? from = null,
        DateTime? to = null,
        int page = 1,
        int pageSize = 20,
        CancellationToken ct = default)
    {
        var query = _db.AuditLogs.AsNoTracking().AsQueryable();

        if (userId.HasValue)
            query = query.Where(l => l.UserId == userId.Value);
        if (applicationId.HasValue)
            query = query.Where(l => l.ApplicationId == applicationId.Value);
        if (!string.IsNullOrEmpty(eventType))
            query = query.Where(l => l.EventType == eventType);
        if (from.HasValue)
            query = query.Where(l => l.Timestamp >= from.Value);
        if (to.HasValue)
            query = query.Where(l => l.Timestamp <= to.Value);

        return await query
            .OrderByDescending(l => l.Timestamp)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);
    }
}
