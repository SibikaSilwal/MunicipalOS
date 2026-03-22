using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MunicipalOS.Api.Extensions;
using MunicipalOS.Application.Common;
using MunicipalOS.Application.Notifications.Queries;

namespace MunicipalOS.Api.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationController : ControllerBase
{
    private readonly IQueryHandler<GetNotificationsQuery, IReadOnlyList<NotificationDto>> _getHandler;

    public NotificationController(
        IQueryHandler<GetNotificationsQuery, IReadOnlyList<NotificationDto>> getHandler)
        => _getHandler = getHandler;

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var result = await _getHandler.HandleAsync(new GetNotificationsQuery(User.GetUserId()), ct);
        return Ok(result);
    }
}
