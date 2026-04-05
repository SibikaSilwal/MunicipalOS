namespace MunicipalOS.Application.Common.Interfaces;

public interface IWorkflowRepository
{
    Task<WorkflowDefinition?> GetByServiceTypeIdAsync(Guid serviceTypeId, CancellationToken ct = default);
    Task<WorkflowDefinition?> GetTrackedByServiceTypeIdAsync(Guid serviceTypeId, CancellationToken ct = default);

    Task<WorkflowDefinition> AddAsync(WorkflowDefinition definition, CancellationToken ct = default);

    Task ReplaceDefinitionStepsAsync(
        WorkflowDefinition definition,
        IReadOnlyList<(int StepOrder, string RoleRequired, string StepName, string? StepDescription, int? ExpectedCompletionMinutes)> steps,
        CancellationToken ct = default);

    Task DeleteAsync(WorkflowDefinition definition, CancellationToken ct = default);
}
