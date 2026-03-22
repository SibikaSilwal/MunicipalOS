using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MunicipalOS.Api.Extensions;
using MunicipalOS.Application.Applications.Commands;
using MunicipalOS.Application.Applications.Queries;
using MunicipalOS.Application.Common;

namespace MunicipalOS.Api.Controllers;

[ApiController]
[Route("api/applications")]
[Authorize]
public class ApplicationController : ControllerBase
{
    private readonly ICommandHandler<SubmitApplicationCommand, Result<SubmitApplicationResult>> _submitHandler;
    private readonly IQueryHandler<GetMyApplicationsQuery, IReadOnlyList<ApplicationSummaryDto>> _getMyHandler;
    private readonly IQueryHandler<GetApplicationByIdQuery, Result<ApplicationDetailDto>> _getByIdHandler;
    private readonly IQueryHandler<GetPendingApplicationsQuery, IReadOnlyList<ApplicationSummaryDto>> _getPendingHandler;
    private readonly ICommandHandler<ApproveApplicationCommand, Result<string>> _approveHandler;
    private readonly ICommandHandler<RejectApplicationCommand, Result<string>> _rejectHandler;
    private readonly ICommandHandler<RequestDocumentsCommand, Result<string>> _requestDocsHandler;
    private readonly ICommandHandler<PickUpStepCommand, Result<string>> _pickUpStepHandler;
    private readonly ICommandHandler<AssignStepCommand, Result<string>> _assignStepHandler;

    public ApplicationController(
        ICommandHandler<SubmitApplicationCommand, Result<SubmitApplicationResult>> submitHandler,
        IQueryHandler<GetMyApplicationsQuery, IReadOnlyList<ApplicationSummaryDto>> getMyHandler,
        IQueryHandler<GetApplicationByIdQuery, Result<ApplicationDetailDto>> getByIdHandler,
        IQueryHandler<GetPendingApplicationsQuery, IReadOnlyList<ApplicationSummaryDto>> getPendingHandler,
        ICommandHandler<ApproveApplicationCommand, Result<string>> approveHandler,
        ICommandHandler<RejectApplicationCommand, Result<string>> rejectHandler,
        ICommandHandler<RequestDocumentsCommand, Result<string>> requestDocsHandler,
        ICommandHandler<PickUpStepCommand, Result<string>> pickUpStepHandler,
        ICommandHandler<AssignStepCommand, Result<string>> assignStepHandler)
    {
        _submitHandler = submitHandler;
        _getMyHandler = getMyHandler;
        _getByIdHandler = getByIdHandler;
        _getPendingHandler = getPendingHandler;
        _approveHandler = approveHandler;
        _rejectHandler = rejectHandler;
        _requestDocsHandler = requestDocsHandler;
        _pickUpStepHandler = pickUpStepHandler;
        _assignStepHandler = assignStepHandler;
    }

    [HttpPost]
    public async Task<IActionResult> Submit([FromBody] SubmitApplicationRequest request, CancellationToken ct)
    {
        var result = await _submitHandler.HandleAsync(
            new SubmitApplicationCommand(User.GetUserId(), request.ServiceTypeId), ct);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return Created($"/api/applications/{result.Value!.Id}", result.Value);
    }

    [HttpGet("my")]
    public async Task<IActionResult> GetMy(CancellationToken ct)
    {
        var result = await _getMyHandler.HandleAsync(new GetMyApplicationsQuery(User.GetUserId()), ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await _getByIdHandler.HandleAsync(new GetApplicationByIdQuery(id), ct);
        if (!result.IsSuccess)
            return NotFound();

        return Ok(result.Value);
    }

    [HttpGet("pending")]
    public async Task<IActionResult> GetPending(CancellationToken ct)
    {
        var result = await _getPendingHandler.HandleAsync(
            new GetPendingApplicationsQuery(User.GetMunicipalityId()), ct);
        return Ok(result);
    }

    [HttpPost("{id:guid}/complete-step")]
    public async Task<IActionResult> CompleteStep(Guid id, [FromBody] CommentRequest request, CancellationToken ct)
    {
        var changedBy = User.GetUserId();
        var result = await _approveHandler.HandleAsync(
            new ApproveApplicationCommand(id, changedBy, request.Comment), ct);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return Ok(new { message = result.Value });
    }

    [HttpPost("{id:guid}/approve")]
    public async Task<IActionResult> Approve(Guid id, [FromBody] CommentRequest request, CancellationToken ct)
    {
        var changedBy = User.GetUserId();
        var result = await _approveHandler.HandleAsync(
            new ApproveApplicationCommand(id, changedBy, request.Comment), ct);
        if (!result.IsSuccess)
            return NotFound(new { error = result.Error });

        return Ok(new { message = result.Value });
    }

    [HttpPost("{id:guid}/reject")]
    public async Task<IActionResult> Reject(Guid id, [FromBody] CommentRequest request, CancellationToken ct)
    {
        var changedBy = User.GetUserId();
        var result = await _rejectHandler.HandleAsync(
            new RejectApplicationCommand(id, changedBy, request.Comment), ct);
        if (!result.IsSuccess)
            return NotFound(new { error = result.Error });

        return Ok(new { message = result.Value });
    }

    [HttpPost("{id:guid}/request-documents")]
    public async Task<IActionResult> RequestDocuments(Guid id, [FromBody] CommentRequest request, CancellationToken ct)
    {
        var changedBy = User.GetUserId();
        var result = await _requestDocsHandler.HandleAsync(
            new RequestDocumentsCommand(id, changedBy, request.Comment), ct);
        if (!result.IsSuccess)
            return NotFound(new { error = result.Error });

        return Ok(new { message = result.Value });
    }

    [HttpPost("{id:guid}/pick-up")]
    public async Task<IActionResult> PickUpStep(Guid id, CancellationToken ct)
    {
        var officerId = User.GetUserId();
        var result = await _pickUpStepHandler.HandleAsync(
            new PickUpStepCommand(id, officerId), ct);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return Ok(new { message = result.Value });
    }

    [HttpPost("{id:guid}/assign-step")]
    public async Task<IActionResult> AssignStep(Guid id, [FromBody] AssignStepRequest request, CancellationToken ct)
    {
        var result = await _assignStepHandler.HandleAsync(
            new AssignStepCommand(id, request.OfficerId), ct);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return Ok(new { message = result.Value });
    }
}

public record SubmitApplicationRequest(Guid ServiceTypeId);
public record CommentRequest(string? Comment);
public record AssignStepRequest(Guid OfficerId);
