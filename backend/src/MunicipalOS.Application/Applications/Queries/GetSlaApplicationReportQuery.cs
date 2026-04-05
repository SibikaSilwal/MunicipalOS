using MunicipalOS.Application.Common;
using MunicipalOS.Application.Common.Models;

namespace MunicipalOS.Application.Applications.Queries;

public record GetSlaApplicationReportQuery(
    Guid MunicipalityId,
    DateTime? FromUtc,
    DateTime? ToUtc,
    Guid? ServiceTypeId,
    bool IncludeRejected,
    int Page,
    int PageSize,
    bool WithinSlaOnly,
    bool BreachedOnly,
    Guid? TerminalOfficerId) : IQuery<PagedSlaApplicationsDto>;

public record PagedSlaApplicationsDto(
    IReadOnlyList<SlaApplicationReportRow> Items,
    int TotalCount,
    int Page,
    int PageSize);
