using MunicipalOS.Application.Common;

namespace MunicipalOS.Application.Admin.Queries;

public record GetAuditLogsQuery(
    Guid? UserId,
    Guid? ApplicationId,
    string? EventType,
    DateTime? From,
    DateTime? To,
    int Page = 1,
    int PageSize = 20) : IQuery<IReadOnlyList<AuditLogDto>>;

public record AuditLogDto(
    Guid Id,
    string EventType,
    Guid UserId,
    Guid? ApplicationId,
    DateTime Timestamp,
    string? Metadata);
