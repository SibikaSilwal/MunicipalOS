namespace MunicipalOS.Application.Common.Models;

public record SlaMetricsSnapshot(
    int TotalCompleted,
    int CompletedWithinSla,
    int Breached,
    double PercentCompletedWithinSla);
