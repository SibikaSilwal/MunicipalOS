namespace MunicipalOS.Domain.Aggregates.ServiceTypes.Entities;

public class RequiredDocument
{
    public Guid Id { get; set; }
    public Guid ServiceTypeId { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool Required { get; set; } = true;

    public ServiceType ServiceType { get; set; } = null!;
}
