using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MunicipalOS.Api.Extensions;
using MunicipalOS.Application.Applications.Queries;
using MunicipalOS.Application.Common;

namespace MunicipalOS.Api.Controllers;

[ApiController]
[Route("api/officers")]
[Authorize]
public class OfficersController : ControllerBase
{
    private readonly IQueryHandler<GetMyAssignedApplicationsQuery, IReadOnlyList<ApplicationSummaryDto>> _assignedHandler;

    public OfficersController(
        IQueryHandler<GetMyAssignedApplicationsQuery, IReadOnlyList<ApplicationSummaryDto>> assignedHandler)
    {
        _assignedHandler = assignedHandler;
    }

    /// <summary>
    /// Active applications whose current workflow step is assigned to the authenticated user (same municipality).
    /// </summary>
    [HttpGet("my-applications")]
    public async Task<IActionResult> GetMyAssignedApplications(CancellationToken ct)
    {
        var result = await _assignedHandler.HandleAsync(
            new GetMyAssignedApplicationsQuery(User.GetUserId(), User.GetMunicipalityId()), ct);
        return Ok(result);
    }
}
