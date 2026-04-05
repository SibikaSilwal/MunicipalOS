namespace MunicipalOS.Application.Common.Models;

/// <summary>
/// SLA rollup grouped by service type (completed applications in the reporting window).
/// </summary>
public record SlaServiceBreakdownRow(
    Guid ServiceTypeId,
    string ServiceTypeName,
    int TotalCompleted,
    int CompletedWithinSla,
    int Breached,
    double PercentCompletedWithinSla);

/// <summary>
/// SLA rollup by the user who recorded the terminal status (latest Approved/Rejected in history).
/// </summary>
public record SlaOfficerBreakdownRow(
    Guid? TerminalOfficerId,
    string TerminalOfficerName,
    int TotalCompleted,
    int CompletedWithinSla,
    int Breached,
    double PercentCompletedWithinSla);

/// <summary>
/// One completed application row for SLA drill-down (terminal completion vs application DueAt).
/// Use a class (not a positional record) so System.Text.Json emits all properties reliably (same idea as ApplicationSummaryDto).
/// </summary>
public sealed class SlaApplicationReportRow
{
    public Guid ApplicationId { get; init; }
    public string FriendlyApplicationId { get; init; } = string.Empty;
    public string ServiceTypeName { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public DateTime CompletedAt { get; init; }
    public DateTime DueAt { get; init; }
    public bool WithinSla { get; init; }
    public Guid? TerminalOfficerId { get; init; }
    public string? TerminalOfficerName { get; init; }
    public int? MinutesLate { get; init; }
}

public record PagedResult<T>(IReadOnlyList<T> Items, int TotalCount);
