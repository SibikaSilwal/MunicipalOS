using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MunicipalOS.Api.Extensions;
using MunicipalOS.Application.Applications.Commands;
using MunicipalOS.Application.Applications.Queries;
using MunicipalOS.Application.Common;
using MunicipalOS.Domain.Enums;

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
    private readonly IQueryHandler<GetCompletedApplicationsQuery, IReadOnlyList<ApplicationSummaryDto>> _getCompletedHandler;
    private readonly IQueryHandler<GetMunicipalityApplicationsQuery, IReadOnlyList<ApplicationSummaryDto>> _getMunicipalityApplicationsHandler;
    private readonly ICommandHandler<ApproveApplicationCommand, Result<string>> _approveHandler;
    private readonly ICommandHandler<RejectApplicationCommand, Result<string>> _rejectHandler;
    private readonly ICommandHandler<RequestDocumentsCommand, Result<string>> _requestDocsHandler;
    private readonly ICommandHandler<PickUpStepCommand, Result<string>> _pickUpStepHandler;
    private readonly ICommandHandler<AssignStepCommand, Result<string>> _assignStepHandler;
    private readonly IQueryHandler<GetSlaMetricsQuery, SlaMetricsDto> _getSlaMetricsHandler;
    private readonly IQueryHandler<GetSlaDashboardQuery, SlaDashboardDto> _getSlaDashboardHandler;
    private readonly IQueryHandler<GetSlaApplicationReportQuery, PagedSlaApplicationsDto> _getSlaApplicationReportHandler;

    public ApplicationController(
        ICommandHandler<SubmitApplicationCommand, Result<SubmitApplicationResult>> submitHandler,
        IQueryHandler<GetMyApplicationsQuery, IReadOnlyList<ApplicationSummaryDto>> getMyHandler,
        IQueryHandler<GetApplicationByIdQuery, Result<ApplicationDetailDto>> getByIdHandler,
        IQueryHandler<GetPendingApplicationsQuery, IReadOnlyList<ApplicationSummaryDto>> getPendingHandler,
        IQueryHandler<GetCompletedApplicationsQuery, IReadOnlyList<ApplicationSummaryDto>> getCompletedHandler,
        IQueryHandler<GetMunicipalityApplicationsQuery, IReadOnlyList<ApplicationSummaryDto>> getMunicipalityApplicationsHandler,
        ICommandHandler<ApproveApplicationCommand, Result<string>> approveHandler,
        ICommandHandler<RejectApplicationCommand, Result<string>> rejectHandler,
        ICommandHandler<RequestDocumentsCommand, Result<string>> requestDocsHandler,
        ICommandHandler<PickUpStepCommand, Result<string>> pickUpStepHandler,
        ICommandHandler<AssignStepCommand, Result<string>> assignStepHandler,
        IQueryHandler<GetSlaMetricsQuery, SlaMetricsDto> getSlaMetricsHandler,
        IQueryHandler<GetSlaDashboardQuery, SlaDashboardDto> getSlaDashboardHandler,
        IQueryHandler<GetSlaApplicationReportQuery, PagedSlaApplicationsDto> getSlaApplicationReportHandler)
    {
        _submitHandler = submitHandler;
        _getMyHandler = getMyHandler;
        _getByIdHandler = getByIdHandler;
        _getPendingHandler = getPendingHandler;
        _getCompletedHandler = getCompletedHandler;
        _getMunicipalityApplicationsHandler = getMunicipalityApplicationsHandler;
        _approveHandler = approveHandler;
        _rejectHandler = rejectHandler;
        _requestDocsHandler = requestDocsHandler;
        _pickUpStepHandler = pickUpStepHandler;
        _assignStepHandler = assignStepHandler;
        _getSlaMetricsHandler = getSlaMetricsHandler;
        _getSlaDashboardHandler = getSlaDashboardHandler;
        _getSlaApplicationReportHandler = getSlaApplicationReportHandler;
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

    /// <summary>All applications in the municipality (any status). Officers and admins only.</summary>
    [HttpGet("all")]
    public async Task<IActionResult> GetAllForMunicipality(CancellationToken ct)
    {
        var role = User.GetRole();
        if (role is not (nameof(RoleName.Admin) or nameof(RoleName.WardOfficer) or nameof(RoleName.MunicipalOfficer)))
            return Forbid();

        var result = await _getMunicipalityApplicationsHandler.HandleAsync(
            new GetMunicipalityApplicationsQuery(User.GetMunicipalityId()), ct);
        return Ok(result);
    }

    [HttpGet("completed")]
    public async Task<IActionResult> GetCompleted(CancellationToken ct)
    {
        if (User.GetRole() != nameof(RoleName.Admin))
            return Forbid();

        var result = await _getCompletedHandler.HandleAsync(
            new GetCompletedApplicationsQuery(User.GetMunicipalityId()), ct);
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

    [HttpGet("metrics/sla")]
    public async Task<IActionResult> GetSlaMetrics(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] Guid? serviceTypeId,
        [FromQuery] bool includeRejected,
        CancellationToken ct)
    {
        if (!CanViewMunicipalitySlaMetrics(User.GetRole()))
            return Forbid();

        try
        {
            var metrics = await _getSlaMetricsHandler.HandleAsync(
                new GetSlaMetricsQuery(
                    User.GetMunicipalityId(),
                    from,
                    to,
                    serviceTypeId,
                    includeRejected),
                ct);

            return Ok(metrics);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("metrics/sla/dashboard")]
    public async Task<IActionResult> GetSlaDashboard(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] Guid? serviceTypeId,
        [FromQuery] bool includeRejected,
        CancellationToken ct)
    {
        if (!CanViewMunicipalitySlaMetrics(User.GetRole()))
            return Forbid();

        try
        {
            var dashboard = await _getSlaDashboardHandler.HandleAsync(
                new GetSlaDashboardQuery(
                    User.GetMunicipalityId(),
                    from,
                    to,
                    serviceTypeId,
                    includeRejected),
                ct);

            return Ok(dashboard);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("metrics/sla/applications")]
    public async Task<IActionResult> GetSlaApplicationReport(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] Guid? serviceTypeId,
        [FromQuery] bool includeRejected,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] bool withinSlaOnly = false,
        [FromQuery] bool breachedOnly = false,
        [FromQuery] Guid? terminalOfficerId = null,
        CancellationToken ct = default)
    {
        if (!CanViewMunicipalitySlaMetrics(User.GetRole()))
            return Forbid();

        try
        {
            var report = await _getSlaApplicationReportHandler.HandleAsync(
                new GetSlaApplicationReportQuery(
                    User.GetMunicipalityId(),
                    from,
                    to,
                    serviceTypeId,
                    includeRejected,
                    page,
                    pageSize,
                    withinSlaOnly,
                    breachedOnly,
                    terminalOfficerId),
                ct);

            // Explicit shape so friendly id always serializes (matches /applications/completed summaries).
            return Ok(new
            {
                items = report.Items.Select(i => new
                {
                    i.ApplicationId,
                    i.FriendlyApplicationId,
                    i.ServiceTypeName,
                    i.Status,
                    i.CompletedAt,
                    i.DueAt,
                    i.WithinSla,
                    i.TerminalOfficerId,
                    i.TerminalOfficerName,
                    i.MinutesLate,
                }).ToList(),
                totalCount = report.TotalCount,
                page = report.Page,
                pageSize = report.PageSize,
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    private static bool CanViewMunicipalitySlaMetrics(string role)
        => role is nameof(RoleName.Admin);
}

public record SubmitApplicationRequest(Guid ServiceTypeId);
public record CommentRequest(string? Comment);
public record AssignStepRequest(Guid OfficerId);
