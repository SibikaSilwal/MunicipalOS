using MunicipalOS.Application.Common;

namespace MunicipalOS.Application.Applications.Queries;

public record GetPendingApplicationsQuery(
    Guid MunicipalityId) : IQuery<IReadOnlyList<ApplicationSummaryDto>>;
