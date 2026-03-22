namespace MunicipalOS.Domain.Aggregates.AuditLogs;

public class AuditLog
{
    public Guid Id { get; set; }
    public string EventType { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public Guid? ApplicationId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string? Metadata { get; set; }

    public User User { get; set; } = null!;
    public Application? Application { get; set; }
}
