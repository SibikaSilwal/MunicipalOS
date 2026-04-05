namespace MunicipalOS.Application.Common;

/// <summary>Builds candidate IDs in the form NP-{MUN}-{yy}-{6} (UTC Gregorian yy).</summary>
public interface IFriendlyApplicationIdGenerator
{
    string BuildCandidate(string municipalityShortNameUpper, DateTime submittedAtUtc);
}
