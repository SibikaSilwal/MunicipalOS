using MunicipalOS.Infrastructure.Services;

namespace MunicipalOS.Tests;

public class NepalBusinessTimeCalculatorTests
{
    private static readonly TimeZoneInfo NepalTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Asia/Kathmandu");
    private readonly NepalBusinessTimeCalculator _calculator = new();

    [Fact]
    public void AddNepalBusinessMinutes_ShouldAddWithinSameWorkingDay()
    {
        var startUtc = ToUtc(2026, 3, 29, 10, 30); // Sunday

        var resultUtc = _calculator.AddNepalBusinessMinutes(startUtc, 120);

        var resultLocal = TimeZoneInfo.ConvertTimeFromUtc(resultUtc, NepalTimeZone);
        Assert.Equal(new DateTime(2026, 3, 29, 12, 30, 0), resultLocal);
    }

    [Fact]
    public void AddNepalBusinessMinutes_ShouldSkipSaturday()
    {
        var startUtc = ToUtc(2026, 3, 28, 11, 0); // Saturday

        var resultUtc = _calculator.AddNepalBusinessMinutes(startUtc, 60);

        var resultLocal = TimeZoneInfo.ConvertTimeFromUtc(resultUtc, NepalTimeZone);
        Assert.Equal(new DateTime(2026, 3, 29, 11, 0, 0), resultLocal);
    }

    [Fact]
    public void IsWithinSla_ShouldReturnFalse_WhenCompletedAfterDueAt()
    {
        var dueAt = DateTime.UtcNow;
        var completedAt = dueAt.AddMinutes(1);

        var result = _calculator.IsWithinSla(completedAt, dueAt);

        Assert.False(result);
    }

    private static DateTime ToUtc(int year, int month, int day, int hour, int minute)
    {
        var local = new DateTime(year, month, day, hour, minute, 0, DateTimeKind.Unspecified);
        return TimeZoneInfo.ConvertTimeToUtc(local, NepalTimeZone);
    }
}
