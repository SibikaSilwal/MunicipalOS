using MunicipalOS.Application.Common;
using MunicipalOS.Application.Common.Interfaces;

namespace MunicipalOS.Application.Municipalities.Queries;

public class GetMunicipalityOfficersQueryHandler
    : IQueryHandler<GetMunicipalityOfficersQuery, Result<IReadOnlyList<MunicipalityOfficerDto>>>
{
    private readonly IMunicipalityRepository _municipalityRepo;
    private readonly IUserRepository _userRepo;

    public GetMunicipalityOfficersQueryHandler(
        IMunicipalityRepository municipalityRepo,
        IUserRepository userRepo)
    {
        _municipalityRepo = municipalityRepo;
        _userRepo = userRepo;
    }

    public async Task<Result<IReadOnlyList<MunicipalityOfficerDto>>> HandleAsync(
        GetMunicipalityOfficersQuery query, CancellationToken ct = default)
    {
        var municipality = await _municipalityRepo.GetByIdAsync(query.MunicipalityId, ct);
        if (municipality is null)
            return Result<IReadOnlyList<MunicipalityOfficerDto>>.Failure("Municipality not found.");

        var officers = await _userRepo.GetOfficersByMunicipalityIdAsync(query.MunicipalityId, ct);

        var dtos = officers
            .Select(u => new MunicipalityOfficerDto(u.Id, u.FullName, u.Role.Name))
            .ToList();

        return Result<IReadOnlyList<MunicipalityOfficerDto>>.Success(dtos);
    }
}
