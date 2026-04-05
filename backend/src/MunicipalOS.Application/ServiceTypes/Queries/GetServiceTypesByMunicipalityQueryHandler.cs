using MunicipalOS.Application.Common;
using MunicipalOS.Application.Common.Interfaces;

namespace MunicipalOS.Application.ServiceTypes.Queries;

public class GetServiceTypesByMunicipalityQueryHandler
    : IQueryHandler<GetServiceTypesByMunicipalityQuery, IReadOnlyList<ServiceTypeDto>>
{
    private readonly IServiceTypeRepository _repo;

    public GetServiceTypesByMunicipalityQueryHandler(IServiceTypeRepository repo) => _repo = repo;

    public async Task<IReadOnlyList<ServiceTypeDto>> HandleAsync(
        GetServiceTypesByMunicipalityQuery query, CancellationToken ct = default)
    {
        var serviceTypes = await _repo.GetByMunicipalityIdAsync(query.MunicipalityId, ct);

        return serviceTypes
            .Select(s => new ServiceTypeDto(
                s.Id,
                s.Name,
                s.Description,
                s.MunicipalityId,
                ResolveExpectedCompletionMinutes(s),
                s.RequiredDocuments
                    .Select(d => new RequiredDocumentDto(d.Id, d.Name, d.Required))
                    .ToList()))
            .ToList();
    }

    private static int? ResolveExpectedCompletionMinutes(ServiceType serviceType)
    {
        if (serviceType.ExpectedCompletionMinutes.HasValue)
            return serviceType.ExpectedCompletionMinutes.Value;

        var stepMinutes = serviceType.WorkflowDefinition?.Steps
            .Where(step => step.ExpectedCompletionMinutes.HasValue)
            .Select(step => step.ExpectedCompletionMinutes!.Value)
            .ToList();

        if (stepMinutes is null || stepMinutes.Count == 0)
            return null;

        return stepMinutes.Sum();
    }
}
