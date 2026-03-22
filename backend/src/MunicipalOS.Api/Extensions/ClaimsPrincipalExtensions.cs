using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace MunicipalOS.Api.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal user)
    {
        var value = user.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? throw new InvalidOperationException("User ID claim ('sub') is missing from the token.");
        return Guid.Parse(value);
    }

    public static Guid GetMunicipalityId(this ClaimsPrincipal user)
    {
        var value = user.FindFirstValue("municipalityId")
            ?? throw new InvalidOperationException("Municipality ID claim is missing from the token.");
        return Guid.Parse(value);
    }

    public static string GetRole(this ClaimsPrincipal user)
        => user.FindFirstValue("role") ?? string.Empty;
}
