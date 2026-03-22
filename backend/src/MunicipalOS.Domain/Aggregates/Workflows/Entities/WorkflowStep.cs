namespace MunicipalOS.Domain.Aggregates.Workflows.Entities;

public class WorkflowStep
{
    public Guid Id { get; set; }
    public Guid WorkflowDefinitionId { get; set; }
    public int StepOrder { get; set; }
    public string RoleRequired { get; set; } = string.Empty;
    public string StepName { get; set; } = string.Empty;
    public string? StepDescription { get; set; }

    public WorkflowDefinition WorkflowDefinition { get; set; } = null!;
}
