using MunicipalOS.Application.Common;
using MunicipalOS.Application.Common.Interfaces;

namespace MunicipalOS.Application.Applications.Queries;

public class GetSlaApplicationReportQueryHandler
    : IQueryHandler<GetSlaApplicationReportQuery, PagedSlaApplicationsDto>
{
    private const int MaxPageSize = 100;

    private readonly IApplicationRepository _applicationRepository;

    public GetSlaApplicationReportQueryHandler(IApplicationRepository applicationRepository)
        => _applicationRepository = applicationRepository;

    public async Task<PagedSlaApplicationsDto> HandleAsync(
        GetSlaApplicationReportQuery query,
        CancellationToken ct = default)
    {
        var fromUtc = query.FromUtc?.ToUniversalTime() ?? DateTime.UtcNow.AddDays(-30);
        var toUtc = query.ToUtc?.ToUniversalTime() ?? DateTime.UtcNow;

        if (toUtc < fromUtc)
            throw new ArgumentException("'to' date must be after 'from' date.");

        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, MaxPageSize);

        var paged = await _applicationRepository.GetSlaApplicationRowsAsync(
            query.MunicipalityId,
            fromUtc,
            toUtc,
            query.ServiceTypeId,
            query.IncludeRejected,
            page,
            pageSize,
            query.WithinSlaOnly,
            query.BreachedOnly,
            query.TerminalOfficerId,
            ct);

        return new PagedSlaApplicationsDto(
            paged.Items,
            paged.TotalCount,
            page,
            pageSize);
    }
}
