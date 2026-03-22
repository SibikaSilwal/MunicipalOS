namespace MunicipalOS.Application.Common.Interfaces;

public interface IWorkflowRepository
{
    Task<WorkflowDefinition?> GetByServiceTypeIdAsync(Guid serviceTypeId, CancellationToken ct = default);
    Task<WorkflowDefinition> AddAsync(WorkflowDefinition definition, CancellationToken ct = default);
}
