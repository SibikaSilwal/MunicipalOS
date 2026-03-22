namespace MunicipalOS.Domain.Aggregates.Users;

public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public Guid RoleId { get; set; }
    public Guid MunicipalityId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Role Role { get; set; } = null!;
    public Municipality Municipality { get; set; } = null!;
    public ICollection<Application> Applications { get; set; } = new List<Application>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();

    public static User Create(
        string email,
        string passwordHash,
        string fullName,
        Guid municipalityId,
        Guid roleId) => new()
    {
        Id = Guid.NewGuid(),
        Email = email,
        PasswordHash = passwordHash,
        FullName = fullName,
        MunicipalityId = municipalityId,
        RoleId = roleId,
        CreatedAt = DateTime.UtcNow
    };
}
