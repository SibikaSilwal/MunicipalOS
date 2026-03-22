using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MunicipalOS.Api.Extensions;
using MunicipalOS.Application.Auth.Commands;
using MunicipalOS.Application.Auth.Queries;
using MunicipalOS.Application.Common;

namespace MunicipalOS.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register(
        [FromBody] RegisterCommand command,
        [FromServices] ICommandHandler<RegisterCommand, Result<RegisterResult>> handler,
        CancellationToken ct)
    {
        var result = await handler.HandleAsync(command, ct);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return Created($"/api/users/{result.Value!.UserId}", result.Value);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(
        [FromBody] LoginQuery query,
        [FromServices] IQueryHandler<LoginQuery, Result<LoginResult>> handler,
        CancellationToken ct)
    {
        var result = await handler.HandleAsync(query, ct);
        if (!result.IsSuccess)
            return Unauthorized(new { error = result.Error });

        return Ok(result.Value);
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetMe(
        [FromServices] IQueryHandler<GetCurrentUserQuery, Result<CurrentUserDto>> handler,
        CancellationToken ct)
    {
        var result = await handler.HandleAsync(new GetCurrentUserQuery(User.GetUserId()), ct);
        if (!result.IsSuccess)
            return NotFound();

        return Ok(result.Value);
    }
}
