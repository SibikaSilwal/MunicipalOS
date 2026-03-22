namespace MunicipalOS.Domain.Aggregates.Applications.Entities;

public class ApplicationStatusHistory
{
    public Guid Id { get; set; }
    public Guid ApplicationId { get; set; }
    public string Status { get; set; } = string.Empty;
    public Guid ChangedBy { get; set; }
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
    public string? Comment { get; set; }

    public Application Application { get; set; } = null!;
    public User ChangedByUser { get; set; } = null!;
}
