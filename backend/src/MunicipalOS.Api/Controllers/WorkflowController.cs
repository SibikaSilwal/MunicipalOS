using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MunicipalOS.Application.Common;
using MunicipalOS.Application.Workflows;
using MunicipalOS.Application.Workflows.Commands;
using MunicipalOS.Application.Workflows.Queries;

namespace MunicipalOS.Api.Controllers;

[ApiController]
[Route("api/workflows")]
[Authorize]
public class WorkflowController : ControllerBase
{
    private readonly ICommandHandler<CreateWorkflowCommand, Result<WorkflowCreatedResult>> _createHandler;
    private readonly ICommandHandler<UpdateWorkflowCommand, Result<WorkflowCreatedResult>> _updateHandler;
    private readonly ICommandHandler<DeleteWorkflowCommand, Result<bool>> _deleteHandler;
    private readonly IQueryHandler<GetWorkflowByServiceTypeQuery, Result<WorkflowDefinitionDto>> _getHandler;

    public WorkflowController(
        ICommandHandler<CreateWorkflowCommand, Result<WorkflowCreatedResult>> createHandler,
        ICommandHandler<UpdateWorkflowCommand, Result<WorkflowCreatedResult>> updateHandler,
        ICommandHandler<DeleteWorkflowCommand, Result<bool>> deleteHandler,
        IQueryHandler<GetWorkflowByServiceTypeQuery, Result<WorkflowDefinitionDto>> getHandler)
    {
        _createHandler = createHandler;
        _updateHandler = updateHandler;
        _deleteHandler = deleteHandler;
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

    [HttpPut("{serviceTypeId:guid}")]
    public async Task<IActionResult> Update(
        Guid serviceTypeId,
        [FromBody] UpdateWorkflowBody? body,
        CancellationToken ct)
    {
        if (body?.Steps is null)
            return BadRequest(new { error = "Request body must include steps." });

        var result = await _updateHandler.HandleAsync(
            new UpdateWorkflowCommand(serviceTypeId, body.Steps), ct);
        if (!result.IsSuccess)
            return MapWorkflowMutationFailure(result.Error!);
        return Ok(result.Value);
    }

    [HttpDelete("{serviceTypeId:guid}")]
    public async Task<IActionResult> Delete(Guid serviceTypeId, CancellationToken ct)
    {
        var result = await _deleteHandler.HandleAsync(new DeleteWorkflowCommand(serviceTypeId), ct);
        if (!result.IsSuccess)
            return MapWorkflowMutationFailure(result.Error!);
        return NoContent();
    }

    [HttpGet("{serviceTypeId:guid}")]
    public async Task<IActionResult> GetByServiceType(Guid serviceTypeId, CancellationToken ct)
    {
        var result = await _getHandler.HandleAsync(new GetWorkflowByServiceTypeQuery(serviceTypeId), ct);
        if (!result.IsSuccess)
            return NotFound();

        return Ok(result.Value);
    }

    private static IActionResult MapWorkflowMutationFailure(string error)
    {
        if (error == WorkflowCommandErrors.NotFound)
            return new NotFoundResult();
        if (error == WorkflowCommandErrors.ConflictApplicationsExist)
            return new ConflictObjectResult(new { error });
        if (error == WorkflowCommandErrors.StepsRequired)
            return new BadRequestObjectResult(new { error });
        return new BadRequestObjectResult(new { error });
    }
}

public record UpdateWorkflowBody(List<WorkflowStepInput> Steps);
