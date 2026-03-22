using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MunicipalOS.Application.Common;
using MunicipalOS.Application.Workflows.Commands;
using MunicipalOS.Application.Workflows.Queries;

namespace MunicipalOS.Api.Controllers;

[ApiController]
[Route("api/workflows")]
[Authorize]
public class WorkflowController : ControllerBase
{
    private readonly ICommandHandler<CreateWorkflowCommand, Result<WorkflowCreatedResult>> _createHandler;
    private readonly IQueryHandler<GetWorkflowByServiceTypeQuery, Result<WorkflowDefinitionDto>> _getHandler;

    public WorkflowController(
        ICommandHandler<CreateWorkflowCommand, Result<WorkflowCreatedResult>> createHandler,
        IQueryHandler<GetWorkflowByServiceTypeQuery, Result<WorkflowDefinitionDto>> getHandler)
    {
        _createHandler = createHandler;
        _getHandler = getHandler;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateWorkflowCommand command, CancellationToken ct)
    {
        var result = await _createHandler.HandleAsync(command, ct);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return Created($"/api/workflows/{result.Value!.ServiceTypeId}", result.Value);
    }

    [HttpGet("{serviceTypeId:guid}")]
    public async Task<IActionResult> GetByServiceType(Guid serviceTypeId, CancellationToken ct)
    {
        var result = await _getHandler.HandleAsync(new GetWorkflowByServiceTypeQuery(serviceTypeId), ct);
        if (!result.IsSuccess)
            return NotFound();

        return Ok(result.Value);
    }
}
