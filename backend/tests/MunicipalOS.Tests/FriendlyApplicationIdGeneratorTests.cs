using MunicipalOS.Application.Common;

namespace MunicipalOS.Tests;

public class FriendlyApplicationIdGeneratorTests
{
    [Fact]
    public void BuildCandidate_ShouldMatchFormat()
    {
        var gen = new FriendlyApplicationIdGenerator();
        var at = new DateTime(2026, 3, 15, 12, 0, 0, DateTimeKind.Utc);
        var id = gen.BuildCandidate("KTM", at);

        Assert.StartsWith("NP-KTM-", id, StringComparison.Ordinal);
        Assert.Matches(@"^NP-KTM-26-[A-Za-z0-9_-]{6}$", id);
    }
}
