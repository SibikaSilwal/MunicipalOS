using MunicipalOS.Application.Common;

namespace MunicipalOS.Application.Applications.Queries;

public record GetCompletedApplicationsQuery(
    Guid MunicipalityId) : IQuery<IReadOnlyList<ApplicationSummaryDto>>;
