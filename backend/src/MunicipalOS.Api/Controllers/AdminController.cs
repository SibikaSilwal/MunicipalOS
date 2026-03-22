using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MunicipalOS.Application.Admin.Queries;
using MunicipalOS.Application.Common;

namespace MunicipalOS.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize]
public class AdminController : ControllerBase
{
    private readonly IQueryHandler<GetAuditLogsQuery, IReadOnlyList<AuditLogDto>> _getAuditLogsHandler;

    public AdminController(
        IQueryHandler<GetAuditLogsQuery, IReadOnlyList<AuditLogDto>> getAuditLogsHandler)
        => _getAuditLogsHandler = getAuditLogsHandler;

    [HttpGet("audit-logs")]
    public async Task<IActionResult> GetAuditLogs(
        [FromQuery] Guid? userId,
        [FromQuery] Guid? applicationId,
        [FromQuery] string? eventType,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var query = new GetAuditLogsQuery(
            userId, applicationId, eventType, from, to,
            page > 0 ? page : 1,
            pageSize > 0 ? pageSize : 20);

        var result = await _getAuditLogsHandler.HandleAsync(query, ct);
        return Ok(result);
    }
}
