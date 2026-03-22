using MunicipalOS.Application.Common;
using MunicipalOS.Application.Common.Interfaces;

namespace MunicipalOS.Application.Auth.Commands;

public class RegisterCommandHandler : ICommandHandler<RegisterCommand, Result<RegisterResult>>
{
    private readonly IUserRepository _userRepository;
    private readonly ITokenService _tokenService;

    public RegisterCommandHandler(IUserRepository userRepository, ITokenService tokenService)
    {
        _userRepository = userRepository;
        _tokenService = tokenService;
    }

    public async Task<Result<RegisterResult>> HandleAsync(RegisterCommand command, CancellationToken ct = default)
    {
        var existing = await _userRepository.GetByEmailAsync(command.Email, ct);
        if (existing is not null)
            return Result<RegisterResult>.Failure("Email already registered.");

        var user = User.Create(
            command.Email,
            BCrypt.Net.BCrypt.HashPassword(command.Password),
            command.FullName,
            command.MunicipalityId,
            command.RoleId);

        await _userRepository.AddAsync(user, ct);
        var token = _tokenService.GenerateToken(user);

        return Result<RegisterResult>.Success(new RegisterResult(user.Id, token));
    }
}
