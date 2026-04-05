using MunicipalOS.Application.Common;

namespace MunicipalOS.Application.Auth.Queries;

public record GetCurrentUserQuery(Guid UserId) : IQuery<Result<CurrentUserDto>>;

public record CurrentUserDto(
    Guid Id,
    string Email,
    string FullName,
    string? Role,
    string? Municipality,
    string? MunicipalityShortName);
