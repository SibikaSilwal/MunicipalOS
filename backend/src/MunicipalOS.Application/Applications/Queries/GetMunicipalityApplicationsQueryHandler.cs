using MunicipalOS.Application.Common;
using MunicipalOS.Application.Common.Interfaces;

namespace MunicipalOS.Application.Applications.Queries;

public class GetMunicipalityApplicationsQueryHandler
    : IQueryHandler<GetMunicipalityApplicationsQuery, IReadOnlyList<ApplicationSummaryDto>>
{
    private readonly IApplicationRepository _repo;

    public GetMunicipalityApplicationsQueryHandler(IApplicationRepository repo) => _repo = repo;

    public async Task<IReadOnlyList<ApplicationSummaryDto>> HandleAsync(
        GetMunicipalityApplicationsQuery query, CancellationToken ct = default)
    {
        var apps = await _repo.GetAllByMunicipalityAsync(query.MunicipalityId, ct);

        return apps
            .Select(a => new ApplicationSummaryDto(
                a.Id,
                a.FriendlyApplicationId,
                a.ServiceTypeId,
                a.ServiceType.Name,
                a.Status.ToString(),
                a.CurrentStep,
                a.SubmittedAt))
            .ToList();
    }
}
