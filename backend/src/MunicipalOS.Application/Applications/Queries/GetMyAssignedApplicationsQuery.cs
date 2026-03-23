using MunicipalOS.Application.Common;

namespace MunicipalOS.Application.Applications.Queries;

public record GetMyAssignedApplicationsQuery(
    Guid OfficerId,
    Guid MunicipalityId) : IQuery<IReadOnlyList<ApplicationSummaryDto>>;
