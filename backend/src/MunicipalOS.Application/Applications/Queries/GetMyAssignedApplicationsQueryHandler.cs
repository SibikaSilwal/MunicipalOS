using MunicipalOS.Application.Common;
using MunicipalOS.Application.Common.Interfaces;

namespace MunicipalOS.Application.Applications.Queries;

public class GetMyAssignedApplicationsQueryHandler
    : IQueryHandler<GetMyAssignedApplicationsQuery, IReadOnlyList<ApplicationSummaryDto>>
{
    private readonly IApplicationRepository _repo;

    public GetMyAssignedApplicationsQueryHandler(IApplicationRepository repo) => _repo = repo;

    public async Task<IReadOnlyList<ApplicationSummaryDto>> HandleAsync(
        GetMyAssignedApplicationsQuery query, CancellationToken ct = default)
    {
        var apps = await _repo.GetActiveAssignedToOfficerAsync(
            query.OfficerId, query.MunicipalityId, ct);

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
