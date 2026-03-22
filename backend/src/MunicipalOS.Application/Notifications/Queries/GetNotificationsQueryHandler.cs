using MunicipalOS.Application.Common;
using MunicipalOS.Application.Common.Interfaces;

namespace MunicipalOS.Application.Notifications.Queries;

public class GetNotificationsQueryHandler
    : IQueryHandler<GetNotificationsQuery, IReadOnlyList<NotificationDto>>
{
    private readonly INotificationRepository _repo;

    public GetNotificationsQueryHandler(INotificationRepository repo) => _repo = repo;

    public async Task<IReadOnlyList<NotificationDto>> HandleAsync(
        GetNotificationsQuery query, CancellationToken ct = default)
    {
        var notifications = await _repo.GetByUserIdAsync(query.UserId, ct);

        return notifications
            .Select(n => new NotificationDto(n.Id, n.Message, n.IsRead, n.SentAt))
            .ToList();
    }
}
