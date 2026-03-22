using Microsoft.EntityFrameworkCore;
using MunicipalOS.Application.Common.Interfaces;

namespace MunicipalOS.Infrastructure.Data.Repositories;

public class NotificationRepository : INotificationRepository
{
    private readonly AppDbContext _db;

    public NotificationRepository(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<Notification>> GetByUserIdAsync(Guid userId, CancellationToken ct = default)
        => await _db.Notifications
            .AsNoTracking()
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.SentAt)
            .ToListAsync(ct);

    public async Task AddAsync(Notification notification, CancellationToken ct = default)
    {
        _db.Notifications.Add(notification);
        await _db.SaveChangesAsync(ct);
    }
}
