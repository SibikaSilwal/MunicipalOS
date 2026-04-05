using MunicipalOS.Domain.Enums;

namespace MunicipalOS.Domain.Aggregates.Applications.Entities;

public class ApplicationWorkflowStep
{
    public Guid Id { get; set; }
    public Guid ApplicationId { get; set; }
    public Guid WorkflowStepId { get; set; }
    public int StepOrder { get; set; }
    public int? ExpectedCompletionMinutes { get; set; }
    public DateTime? DueAt { get; set; }
    public ApplicationStepStatus Status { get; set; } = ApplicationStepStatus.Pending;
    public Guid? AssignedToUserId { get; set; }
    public DateTime? AssignedOn { get; set; }
    public Guid? CompletedByUserId { get; set; }
    public DateTime? CompletedOn { get; set; }
    public string? Comment { get; set; }

    public Application Application { get; set; } = null!;
    public WorkflowStep WorkflowStep { get; set; } = null!;
    public User? AssignedToUser { get; set; }
    public User? CompletedByUser { get; set; }
}
