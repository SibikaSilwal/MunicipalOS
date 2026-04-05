using MunicipalOS.Application.Common;
using MunicipalOS.Application.Common.Models;

namespace MunicipalOS.Application.Applications.Queries;

public record GetSlaDashboardQuery(
    Guid MunicipalityId,
    DateTime? FromUtc,
    DateTime? ToUtc,
    Guid? ServiceTypeId,
    bool IncludeRejected = false) : IQuery<SlaDashboardDto>;

public record SlaDashboardDto(
    DateTime FromUtc,
    DateTime ToUtc,
    int TotalCompleted,
    int CompletedWithinSla,
    int Breached,
    double PercentCompletedWithinSla,
    IReadOnlyList<SlaServiceBreakdownRow> ByService,
    IReadOnlyList<SlaOfficerBreakdownRow> ByTerminalOfficer);
