using MunicipalOS.Application.Common;

namespace MunicipalOS.Application.Auth.Queries;

public record LoginQuery(string Email, string Password) : IQuery<Result<LoginResult>>;

public record LoginResult(string Token);
