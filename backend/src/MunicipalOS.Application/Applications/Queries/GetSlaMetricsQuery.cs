using MunicipalOS.Application.Common;

namespace MunicipalOS.Application.Applications.Queries;

public record GetSlaMetricsQuery(
    Guid MunicipalityId,
    DateTime? FromUtc,
    DateTime? ToUtc,
    Guid? ServiceTypeId,
    bool IncludeRejected = false) : IQuery<SlaMetricsDto>;

public record SlaMetricsDto(
    DateTime FromUtc,
    DateTime ToUtc,
    int TotalCompleted,
    int CompletedWithinSla,
    int Breached,
    double PercentCompletedWithinSla);
