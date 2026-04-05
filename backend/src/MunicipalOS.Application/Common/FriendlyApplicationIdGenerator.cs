using System.Globalization;
using NanoidDotNet;

namespace MunicipalOS.Application.Common;

public sealed class FriendlyApplicationIdGenerator : IFriendlyApplicationIdGenerator
{
    public string BuildCandidate(string municipalityShortNameUpper, DateTime submittedAtUtc)
    {
        var yy = submittedAtUtc.ToUniversalTime()
            .ToString("yy", CultureInfo.InvariantCulture);
        var suffix = Nanoid.Generate(size: 6);
        return $"NP-{municipalityShortNameUpper}-{yy}-{suffix}";
    }
}
