using MunicipalOS.Application.Common;
using MunicipalOS.Application.Common.Interfaces;
using MunicipalOS.Application.Workflows;

namespace MunicipalOS.Application.Workflows.Commands;

public class UpdateWorkflowCommandHandler
    : ICommandHandler<UpdateWorkflowCommand, Result<WorkflowCreatedResult>>
{
    private readonly IWorkflowRepository _workflowRepo;
    private readonly IApplicationRepository _applicationRepo;

    public UpdateWorkflowCommandHandler(
        IWorkflowRepository workflowRepo,
        IApplicationRepository applicationRepo)
    {
        _workflowRepo = workflowRepo;
        _applicationRepo = applicationRepo;
    }

    public async Task<Result<WorkflowCreatedResult>> HandleAsync(
        UpdateWorkflowCommand command, CancellationToken ct = default)
    {
        if (command.Steps.Count == 0)
            return Result<WorkflowCreatedResult>.Failure(WorkflowCommandErrors.StepsRequired);

        if (await _applicationRepo.ExistsForServiceTypeAsync(command.ServiceTypeId, ct))
            return Result<WorkflowCreatedResult>.Failure(WorkflowCommandErrors.ConflictApplicationsExist);

        var definition = await _workflowRepo.GetTrackedByServiceTypeIdAsync(command.ServiceTypeId, ct);
        if (definition is null)
            return Result<WorkflowCreatedResult>.Failure(WorkflowCommandErrors.NotFound);

        var tuples = command.Steps
            .Select(s => (
                s.StepOrder,
                s.RoleRequired,
                s.StepName,
                s.StepDescription,
                s.ExpectedCompletionMinutes))
            .ToList();

        await _workflowRepo.ReplaceDefinitionStepsAsync(definition, tuples, ct);

        return Result<WorkflowCreatedResult>.Success(
            new WorkflowCreatedResult(definition.Id, definition.ServiceTypeId));
    }
}
