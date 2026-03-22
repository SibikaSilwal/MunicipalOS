namespace MunicipalOS.Domain.Aggregates.Municipalities;

public class Municipality
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;

    public ICollection<User> Users { get; set; } = new List<User>();
    public ICollection<ServiceType> ServiceTypes { get; set; } = new List<ServiceType>();

    public static Municipality Create(string name) => new()
    {
        Id = Guid.NewGuid(),
        Name = name
    };
}
