using MunicipalOS.Application.Common;

namespace MunicipalOS.Application.Applications.Queries;

public record GetMyApplicationsQuery(Guid CitizenId) : IQuery<IReadOnlyList<ApplicationSummaryDto>>;

public record ApplicationSummaryDto(
    Guid Id,
    string FriendlyApplicationId,
    Guid ServiceTypeId,
    string ServiceTypeName,
    string Status,
    int CurrentStep,
    DateTime SubmittedAt);
