using MunicipalOS.Application.Common;

namespace MunicipalOS.Application.Applications.Queries;

public record GetMunicipalityApplicationsQuery(
    Guid MunicipalityId) : IQuery<IReadOnlyList<ApplicationSummaryDto>>;
