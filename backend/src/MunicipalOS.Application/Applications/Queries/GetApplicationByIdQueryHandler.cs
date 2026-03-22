using MunicipalOS.Application.Common;
using MunicipalOS.Application.Common.Interfaces;

namespace MunicipalOS.Application.Applications.Queries;

public class GetApplicationByIdQueryHandler
    : IQueryHandler<GetApplicationByIdQuery, Result<ApplicationDetailDto>>
{
    private readonly IApplicationRepository _repo;

    public GetApplicationByIdQueryHandler(IApplicationRepository repo) => _repo = repo;

    public async Task<Result<ApplicationDetailDto>> HandleAsync(
        GetApplicationByIdQuery query, CancellationToken ct = default)
    {
        var app = await _repo.GetByIdAsync(query.Id, ct);
        if (app is null)
            return Result<ApplicationDetailDto>.Failure("Application not found.");

        var dto = new ApplicationDetailDto(
            app.Id,
            app.CitizenId,
            app.Citizen.FullName,
            app.ServiceTypeId,
            app.ServiceType.Name,
            app.Status.ToString(),
            app.CurrentStep,
            app.SubmittedAt,
            app.Documents
                .Select(d => new ApplicationDocumentDto(d.Id, d.DocumentName, d.FilePath, d.UploadedAt))
                .ToList(),
            app.StatusHistory
                .Select(h => new ApplicationStatusHistoryDto(h.Id, h.Status, h.ChangedBy, h.ChangedAt, h.Comment))
                .ToList(),
            app.WorkflowSteps
                .OrderBy(s => s.StepOrder)
                .Select(s => new ApplicationWorkflowStepDto(
                    s.Id,
                    s.StepOrder,
                    s.WorkflowStep.StepName,
                    s.WorkflowStep.StepDescription,
                    s.WorkflowStep.RoleRequired,
                    s.Status.ToString(),
                    s.AssignedToUserId,
                    s.AssignedToUser?.FullName,
                    s.AssignedOn,
                    s.CompletedByUserId,
                    s.CompletedByUser?.FullName,
                    s.CompletedOn,
                    s.Comment))
                .ToList());

        return Result<ApplicationDetailDto>.Success(dto);
    }
}
