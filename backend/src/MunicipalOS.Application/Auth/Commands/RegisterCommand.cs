using MunicipalOS.Application.Common;

namespace MunicipalOS.Application.Auth.Commands;

public record RegisterCommand(
    string Email,
    string Password,
    string FullName,
    Guid MunicipalityId,
    Guid RoleId) : ICommand<Result<RegisterResult>>;

public record RegisterResult(Guid UserId, string Token);
