using MunicipalOS.Application.Common;

namespace MunicipalOS.Application.Notifications.Queries;

public record GetNotificationsQuery(Guid UserId) : IQuery<IReadOnlyList<NotificationDto>>;

public record NotificationDto(Guid Id, string Message, bool IsRead, DateTime SentAt);
