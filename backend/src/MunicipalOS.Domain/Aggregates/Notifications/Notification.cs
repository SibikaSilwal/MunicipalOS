namespace MunicipalOS.Domain.Aggregates.Notifications;

public class Notification
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime SentAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}
