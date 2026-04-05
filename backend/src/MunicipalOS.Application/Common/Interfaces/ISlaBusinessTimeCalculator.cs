namespace MunicipalOS.Application.Common.Interfaces;

public interface ISlaBusinessTimeCalculator
{
    DateTime AddNepalBusinessMinutes(DateTime startUtc, int durationMinutes);
    bool IsWithinSla(DateTime completedAtUtc, DateTime dueAtUtc);
}
