using MunicipalOS.Application.Common;
using MunicipalOS.Application.Common.Interfaces;

namespace MunicipalOS.Application.Applications.Queries;

public class GetSlaMetricsQueryHandler
    : IQueryHandler<GetSlaMetricsQuery, SlaMetricsDto>
{
    private readonly IApplicationRepository _applicationRepository;

    public GetSlaMetricsQueryHandler(IApplicationRepository applicationRepository)
        => _applicationRepository = applicationRepository;

    public async Task<SlaMetricsDto> HandleAsync(GetSlaMetricsQuery query, CancellationToken ct = default)
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

        return new SlaMetricsDto(
            fromUtc,
            toUtc,
            snapshot.TotalCompleted,
            snapshot.CompletedWithinSla,
            snapshot.Breached,
            snapshot.PercentCompletedWithinSla);
    }
}
