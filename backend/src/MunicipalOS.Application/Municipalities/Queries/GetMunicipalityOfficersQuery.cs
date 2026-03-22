using MunicipalOS.Application.Common;

namespace MunicipalOS.Application.Municipalities.Queries;

public record GetMunicipalityOfficersQuery(Guid MunicipalityId)
    : IQuery<Result<IReadOnlyList<MunicipalityOfficerDto>>>;

public record MunicipalityOfficerDto(Guid Id, string FullName, string RoleName);
