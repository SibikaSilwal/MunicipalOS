using MunicipalOS.Application.Common;
using MunicipalOS.Application.Common.Interfaces;

namespace MunicipalOS.Application.Auth.Queries;

public class GetCurrentUserQueryHandler
    : IQueryHandler<GetCurrentUserQuery, Result<CurrentUserDto>>
{
    private readonly IUserRepository _repo;

    public GetCurrentUserQueryHandler(IUserRepository repo) => _repo = repo;

    public async Task<Result<CurrentUserDto>> HandleAsync(
        GetCurrentUserQuery query, CancellationToken ct = default)
    {
        var user = await _repo.GetByIdAsync(query.UserId, ct);
        if (user is null)
            return Result<CurrentUserDto>.Failure("User not found.");

        return Result<CurrentUserDto>.Success(new CurrentUserDto(
            user.Id,
            user.Email,
            user.FullName,
            user.Role?.Name,
            user.Municipality?.Name));
    }
}
