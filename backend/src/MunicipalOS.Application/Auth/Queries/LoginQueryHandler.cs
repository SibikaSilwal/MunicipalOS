using MunicipalOS.Application.Common;
using MunicipalOS.Application.Common.Interfaces;

namespace MunicipalOS.Application.Auth.Queries;

public class LoginQueryHandler : IQueryHandler<LoginQuery, Result<LoginResult>>
{
    private readonly IUserRepository _userRepository;
    private readonly ITokenService _tokenService;

    public LoginQueryHandler(IUserRepository userRepository, ITokenService tokenService)
    {
        _userRepository = userRepository;
        _tokenService = tokenService;
    }

    public async Task<Result<LoginResult>> HandleAsync(LoginQuery query, CancellationToken ct = default)
    {
        var user = await _userRepository.GetByEmailAsync(query.Email, ct);
        if (user is null || !BCrypt.Net.BCrypt.Verify(query.Password, user.PasswordHash))
            return Result<LoginResult>.Failure("Invalid email or password.");

        var token = _tokenService.GenerateToken(user);
        return Result<LoginResult>.Success(new LoginResult(token));
    }
}
