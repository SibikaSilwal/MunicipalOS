using MunicipalOS.Application.Common;
using MunicipalOS.Application.Common.Interfaces;

namespace MunicipalOS.Application.Municipalities.Queries;

public class GetMunicipalitiesQueryHandler
    : IQueryHandler<GetMunicipalitiesQuery, IReadOnlyList<MunicipalityDto>>
{
    private readonly IMunicipalityRepository _repo;

    public GetMunicipalitiesQueryHandler(IMunicipalityRepository repo) => _repo = repo;

    public async Task<IReadOnlyList<MunicipalityDto>> HandleAsync(
        GetMunicipalitiesQuery query, CancellationToken ct = default)
    {
        var municipalities = await _repo.GetAllAsync(ct);

        return municipalities
            .Select(m => new MunicipalityDto(m.Id, m.Name, m.ShortName))
            .ToList();
    }
}
