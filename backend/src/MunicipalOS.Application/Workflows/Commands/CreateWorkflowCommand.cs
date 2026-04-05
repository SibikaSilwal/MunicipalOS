using MunicipalOS.Application.Common;

namespace MunicipalOS.Application.Workflows.Commands;

public record CreateWorkflowCommand(
    Guid ServiceTypeId,
    List<WorkflowStepInput> Steps) : ICommand<Result<WorkflowCreatedResult>>;

public record WorkflowStepInput(
    int StepOrder,
    string RoleRequired,
    string StepName,
    string? StepDescription,
    int? ExpectedCompletionMinutes);

public record WorkflowCreatedResult(Guid Id, Guid ServiceTypeId);
