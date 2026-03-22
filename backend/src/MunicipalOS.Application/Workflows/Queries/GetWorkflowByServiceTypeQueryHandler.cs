using MunicipalOS.Application.Common;
using MunicipalOS.Application.Common.Interfaces;

namespace MunicipalOS.Application.Workflows.Queries;

public class GetWorkflowByServiceTypeQueryHandler
    : IQueryHandler<GetWorkflowByServiceTypeQuery, Result<WorkflowDefinitionDto>>
{
    private readonly IWorkflowRepository _repo;

    public GetWorkflowByServiceTypeQueryHandler(IWorkflowRepository repo) => _repo = repo;

    public async Task<Result<WorkflowDefinitionDto>> HandleAsync(
        GetWorkflowByServiceTypeQuery query, CancellationToken ct = default)
    {
        var definition = await _repo.GetByServiceTypeIdAsync(query.ServiceTypeId, ct);
        if (definition is null)
            return Result<WorkflowDefinitionDto>.Failure("Workflow not found.");

        var dto = new WorkflowDefinitionDto(
            definition.Id,
            definition.ServiceTypeId,
            definition.Steps
                .Select(s => new WorkflowStepDto(s.Id, s.StepOrder, s.RoleRequired, s.StepName, s.StepDescription))
                .ToList());

        return Result<WorkflowDefinitionDto>.Success(dto);
    }
}
