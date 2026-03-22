namespace MunicipalOS.Domain.Aggregates.Workflows;

public class WorkflowDefinition
{
    public Guid Id { get; set; }
    public Guid ServiceTypeId { get; set; }

    public ServiceType ServiceType { get; set; } = null!;
    public ICollection<WorkflowStep> Steps { get; set; } = new List<WorkflowStep>();

    public static WorkflowDefinition Create(
        Guid serviceTypeId,
        IEnumerable<(int StepOrder, string RoleRequired, string StepName, string? StepDescription)> steps) => new()
    {
        Id = Guid.NewGuid(),
        ServiceTypeId = serviceTypeId,
        Steps = steps.Select(s => new WorkflowStep
        {
            Id = Guid.NewGuid(),
            StepOrder = s.StepOrder,
            RoleRequired = s.RoleRequired,
            StepName = s.StepName,
            StepDescription = s.StepDescription
        }).ToList()
    };
}
