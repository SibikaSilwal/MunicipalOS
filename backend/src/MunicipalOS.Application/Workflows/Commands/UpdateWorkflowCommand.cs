using MunicipalOS.Application.Common;

namespace MunicipalOS.Application.Workflows.Commands;

public record UpdateWorkflowCommand(
    Guid ServiceTypeId,
    List<WorkflowStepInput> Steps) : ICommand<Result<WorkflowCreatedResult>>;
