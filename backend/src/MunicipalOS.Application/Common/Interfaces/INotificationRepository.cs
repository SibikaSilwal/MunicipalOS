namespace MunicipalOS.Application.Common.Interfaces;

public interface INotificationRepository
{
    Task<IReadOnlyList<Notification>> GetByUserIdAsync(Guid userId, CancellationToken ct = default);
    Task AddAsync(Notification notification, CancellationToken ct = default);
}
