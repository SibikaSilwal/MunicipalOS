using MunicipalOS.Application.Common;
using MunicipalOS.Application.Common.Interfaces;

namespace MunicipalOS.Application.Applications.Queries;

public class GetCompletedApplicationsQueryHandler
    : IQueryHandler<GetCompletedApplicationsQuery, IReadOnlyList<ApplicationSummaryDto>>
{
    private readonly IApplicationRepository _repo;

    public GetCompletedApplicationsQueryHandler(IApplicationRepository repo) => _repo = repo;

    public async Task<IReadOnlyList<ApplicationSummaryDto>> HandleAsync(
        GetCompletedApplicationsQuery query, CancellationToken ct = default)
    {
        var apps = await _repo.GetTerminalByMunicipalityAsync(query.MunicipalityId, ct);

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
