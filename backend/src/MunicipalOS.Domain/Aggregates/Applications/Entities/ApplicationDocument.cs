namespace MunicipalOS.Domain.Aggregates.Applications.Entities;

public class ApplicationDocument
{
    public Guid Id { get; set; }
    public Guid ApplicationId { get; set; }
    public string DocumentName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    public Application Application { get; set; } = null!;
}
