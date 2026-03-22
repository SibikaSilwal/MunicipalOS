using MunicipalOS.Application.Common;
using MunicipalOS.Application.Common.Interfaces;

namespace MunicipalOS.Application.Applications.Queries;

public class GetPendingApplicationsQueryHandler
    : IQueryHandler<GetPendingApplicationsQuery, IReadOnlyList<ApplicationSummaryDto>>
{
    private readonly IApplicationRepository _repo;

    public GetPendingApplicationsQueryHandler(IApplicationRepository repo) => _repo = repo;

    public async Task<IReadOnlyList<ApplicationSummaryDto>> HandleAsync(
        GetPendingApplicationsQuery query, CancellationToken ct = default)
    {
        var apps = await _repo.GetActiveByMunicipalityAsync(query.MunicipalityId, ct);

        var active = DomainApplication.GetActiveApplications(apps, query.MunicipalityId);

        return active
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
