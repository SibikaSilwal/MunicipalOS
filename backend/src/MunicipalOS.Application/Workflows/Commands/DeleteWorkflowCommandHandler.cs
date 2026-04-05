using MunicipalOS.Application.Common;
using MunicipalOS.Application.Common.Interfaces;
using MunicipalOS.Application.Workflows;

namespace MunicipalOS.Application.Workflows.Commands;

public class DeleteWorkflowCommandHandler
    : ICommandHandler<DeleteWorkflowCommand, Result<bool>>
{
    private readonly IWorkflowRepository _workflowRepo;
    private readonly IApplicationRepository _applicationRepo;

    public DeleteWorkflowCommandHandler(
        IWorkflowRepository workflowRepo,
        IApplicationRepository applicationRepo)
    {
        _workflowRepo = workflowRepo;
        _applicationRepo = applicationRepo;
    }

    public async Task<Result<bool>> HandleAsync(
        DeleteWorkflowCommand command, CancellationToken ct = default)
    {
        if (await _applicationRepo.ExistsForServiceTypeAsync(command.ServiceTypeId, ct))
            return Result<bool>.Failure(WorkflowCommandErrors.ConflictApplicationsExist);

        var definition = await _workflowRepo.GetTrackedByServiceTypeIdAsync(command.ServiceTypeId, ct);
        if (definition is null)
            return Result<bool>.Failure(WorkflowCommandErrors.NotFound);

        await _workflowRepo.DeleteAsync(definition, ct);

        return Result<bool>.Success(true);
    }
}
