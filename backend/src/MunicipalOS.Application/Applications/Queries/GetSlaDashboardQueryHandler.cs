using MunicipalOS.Application.Common;
using MunicipalOS.Application.Common.Interfaces;

namespace MunicipalOS.Application.Applications.Queries;

public class GetSlaDashboardQueryHandler
    : IQueryHandler<GetSlaDashboardQuery, SlaDashboardDto>
{
    private readonly IApplicationRepository _applicationRepository;

    public GetSlaDashboardQueryHandler(IApplicationRepository applicationRepository)
        => _applicationRepository = applicationRepository;

    public async Task<SlaDashboardDto> HandleAsync(GetSlaDashboardQuery query, CancellationToken ct = default)
    {
        var fromUtc = query.FromUtc?.ToUniversalTime() ?? DateTime.UtcNow.AddDays(-30);
        var toUtc = query.ToUtc?.ToUniversalTime() ?? DateTime.UtcNow;

        if (toUtc < fromUtc)
            throw new ArgumentException("'to' date must be after 'from' date.");

        var snapshot = await _applicationRepository.GetSlaMetricsAsync(
            query.MunicipalityId,
            fromUtc,
            toUtc,
            query.ServiceTypeId,
            query.IncludeRejected,
            ct);

        var byService = await _applicationRepository.GetSlaBreakdownByServiceAsync(
            query.MunicipalityId,
            fromUtc,
            toUtc,
            query.ServiceTypeId,
            query.IncludeRejected,
            ct);

        var byOfficer = await _applicationRepository.GetSlaBreakdownByTerminalOfficerAsync(
            query.MunicipalityId,
            fromUtc,
            toUtc,
            query.ServiceTypeId,
            query.IncludeRejected,
            ct);

        return new SlaDashboardDto(
            fromUtc,
            toUtc,
            snapshot.TotalCompleted,
            snapshot.CompletedWithinSla,
            snapshot.Breached,
            snapshot.PercentCompletedWithinSla,
            byService,
            byOfficer);
    }
}
