using MunicipalOS.Application.Common.Interfaces;

namespace MunicipalOS.Infrastructure.Services;

public class NepalBusinessTimeCalculator : ISlaBusinessTimeCalculator
{
    private static readonly TimeZoneInfo NepalTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Asia/Kathmandu");
    private static readonly TimeOnly WorkDayStart = new(10, 0);
    private static readonly TimeOnly WorkDayEnd = new(17, 0);
    private static readonly HashSet<DateOnly> Holidays = [];

    public DateTime AddNepalBusinessMinutes(DateTime startUtc, int durationMinutes)
    {
        if (durationMinutes <= 0)
            return startUtc;

        var localCursor = TimeZoneInfo.ConvertTimeFromUtc(startUtc, NepalTimeZone);
        localCursor = MoveToBusinessWindow(localCursor);

        var remainingMinutes = durationMinutes;
        while (remainingMinutes > 0)
        {
            var dayEnd = localCursor.Date.Add(WorkDayEnd.ToTimeSpan());
            var remainingForDay = (int)Math.Floor((dayEnd - localCursor).TotalMinutes);
            if (remainingMinutes <= remainingForDay)
            {
                localCursor = localCursor.AddMinutes(remainingMinutes);
                break;
            }

            remainingMinutes -= remainingForDay;
            localCursor = MoveToBusinessWindow(localCursor.Date.AddDays(1).Add(WorkDayStart.ToTimeSpan()));
        }

        return TimeZoneInfo.ConvertTimeToUtc(localCursor, NepalTimeZone);
    }

    public bool IsWithinSla(DateTime completedAtUtc, DateTime dueAtUtc)
        => completedAtUtc <= dueAtUtc;

    private static DateTime MoveToBusinessWindow(DateTime localDateTime)
    {
        var cursor = localDateTime;

        while (!IsWorkingDate(DateOnly.FromDateTime(cursor)))
        {
            cursor = cursor.Date.AddDays(1).Add(WorkDayStart.ToTimeSpan());
        }

        if (cursor.TimeOfDay < WorkDayStart.ToTimeSpan())
            return cursor.Date.Add(WorkDayStart.ToTimeSpan());

        if (cursor.TimeOfDay >= WorkDayEnd.ToTimeSpan())
            return MoveToBusinessWindow(cursor.Date.AddDays(1).Add(WorkDayStart.ToTimeSpan()));

        return cursor;
    }

    private static bool IsWorkingDate(DateOnly date)
        => date.DayOfWeek != DayOfWeek.Saturday && !Holidays.Contains(date);
}
