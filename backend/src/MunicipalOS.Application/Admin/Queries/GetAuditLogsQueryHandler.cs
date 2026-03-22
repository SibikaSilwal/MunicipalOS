using MunicipalOS.Application.Common;
using MunicipalOS.Application.Common.Interfaces;

namespace MunicipalOS.Application.Admin.Queries;

public class GetAuditLogsQueryHandler
    : IQueryHandler<GetAuditLogsQuery, IReadOnlyList<AuditLogDto>>
{
    private readonly IAuditLogRepository _repo;

    public GetAuditLogsQueryHandler(IAuditLogRepository repo) => _repo = repo;

    public async Task<IReadOnlyList<AuditLogDto>> HandleAsync(
        GetAuditLogsQuery query, CancellationToken ct = default)
    {
        var logs = await _repo.QueryAsync(
            query.UserId, query.ApplicationId, query.EventType,
            query.From, query.To, query.Page, query.PageSize, ct);

        return logs
            .Select(l => new AuditLogDto(l.Id, l.EventType, l.UserId, l.ApplicationId, l.Timestamp, l.Metadata))
            .ToList();
    }
}
