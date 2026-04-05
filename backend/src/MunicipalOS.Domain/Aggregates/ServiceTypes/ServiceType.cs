namespace MunicipalOS.Domain.Aggregates.ServiceTypes;

public class ServiceType
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid MunicipalityId { get; set; }
    public int? ExpectedCompletionMinutes { get; set; }

    public Municipality Municipality { get; set; } = null!;
    public ICollection<RequiredDocument> RequiredDocuments { get; set; } = new List<RequiredDocument>();
    public WorkflowDefinition? WorkflowDefinition { get; set; }
    public ICollection<Application> Applications { get; set; } = new List<Application>();

    public static ServiceType Create(
        string name,
        string? description,
        Guid municipalityId,
        IEnumerable<(string Name, bool Required)> requiredDocuments,
        int? expectedCompletionMinutes = null) => new()
    {
        Id = Guid.NewGuid(),
        Name = name,
        Description = description,
        MunicipalityId = municipalityId,
        ExpectedCompletionMinutes = expectedCompletionMinutes,
        RequiredDocuments = requiredDocuments.Select(d => new RequiredDocument
        {
            Id = Guid.NewGuid(),
            Name = d.Name,
            Required = d.Required
        }).ToList()
    };
}
