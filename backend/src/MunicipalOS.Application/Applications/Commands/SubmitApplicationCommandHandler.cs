using MunicipalOS.Application.Common;
using MunicipalOS.Application.Common.Interfaces;

namespace MunicipalOS.Application.Applications.Commands;

public class SubmitApplicationCommandHandler
    : ICommandHandler<SubmitApplicationCommand, Result<SubmitApplicationResult>>
{
    private readonly IApplicationRepository _repo;
    private readonly IWorkflowRepository _workflowRepo;

    public SubmitApplicationCommandHandler(
        IApplicationRepository repo,
        IWorkflowRepository workflowRepo)
    {
        _repo = repo;
        _workflowRepo = workflowRepo;
    }

    public async Task<Result<SubmitApplicationResult>> HandleAsync(
        SubmitApplicationCommand command, CancellationToken ct = default)
    {
        var workflow = await _workflowRepo.GetByServiceTypeIdAsync(command.ServiceTypeId, ct);
        if (workflow is null || workflow.Steps.Count == 0)
            return Result<SubmitApplicationResult>.Failure("No workflow defined for this service type.");

        var application = DomainApplication.Create(command.CitizenId, command.ServiceTypeId);
        application.InitializeWorkflowSteps(workflow.Steps);

        await _repo.AddAsync(application, ct);

        return Result<SubmitApplicationResult>.Success(new SubmitApplicationResult(application.Id));
    }
}
