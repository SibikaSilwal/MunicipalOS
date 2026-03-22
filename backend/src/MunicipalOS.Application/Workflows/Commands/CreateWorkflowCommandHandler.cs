using MunicipalOS.Application.Common;
using MunicipalOS.Application.Common.Interfaces;

namespace MunicipalOS.Application.Workflows.Commands;

public class CreateWorkflowCommandHandler
    : ICommandHandler<CreateWorkflowCommand, Result<WorkflowCreatedResult>>
{
    private readonly IWorkflowRepository _repo;

    public CreateWorkflowCommandHandler(IWorkflowRepository repo) => _repo = repo;

    public async Task<Result<WorkflowCreatedResult>> HandleAsync(
        CreateWorkflowCommand command, CancellationToken ct = default)
    {
        var definition = WorkflowDefinition.Create(
            command.ServiceTypeId,
            command.Steps.Select(s => (s.StepOrder, s.RoleRequired, s.StepName, s.StepDescription)));

        await _repo.AddAsync(definition, ct);

        return Result<WorkflowCreatedResult>.Success(
            new WorkflowCreatedResult(definition.Id, definition.ServiceTypeId));
    }
}
