using MunicipalOS.Application.Common;

namespace MunicipalOS.Application.Workflows.Queries;

public record GetWorkflowByServiceTypeQuery(Guid ServiceTypeId)
    : IQuery<Result<WorkflowDefinitionDto>>;

public record WorkflowDefinitionDto(Guid Id, Guid ServiceTypeId, List<WorkflowStepDto> Steps);

public record WorkflowStepDto(
    Guid Id,
    int StepOrder,
    string RoleRequired,
    string StepName,
    string? StepDescription,
    int? ExpectedCompletionMinutes);
