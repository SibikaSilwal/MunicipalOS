using MunicipalOS.Application.Common;
using MunicipalOS.Application.Common.Interfaces;

namespace MunicipalOS.Application.Applications.Queries;

public class GetMyApplicationsQueryHandler
    : IQueryHandler<GetMyApplicationsQuery, IReadOnlyList<ApplicationSummaryDto>>
{
    private readonly IApplicationRepository _repo;

    public GetMyApplicationsQueryHandler(IApplicationRepository repo) => _repo = repo;

    public async Task<IReadOnlyList<ApplicationSummaryDto>> HandleAsync(
        GetMyApplicationsQuery query, CancellationToken ct = default)
    {
        var apps = await _repo.GetByCitizenIdAsync(query.CitizenId, ct);

        return apps
            .Select(a => new ApplicationSummaryDto(
                a.Id,
                a.ServiceTypeId,
                a.ServiceType.Name,
                a.Status.ToString(),
                a.CurrentStep,
                a.SubmittedAt))
            .ToList();
    }
}
