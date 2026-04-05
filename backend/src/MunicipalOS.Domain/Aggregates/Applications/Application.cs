using MunicipalOS.Domain.Enums;

namespace MunicipalOS.Domain.Aggregates.Applications;

public class Application
{
    public Guid Id { get; set; }
    public string FriendlyApplicationId { get; set; } = string.Empty;
    public Guid CitizenId { get; set; }
    public Guid ServiceTypeId { get; set; }
    public ApplicationStatus Status { get; set; } = ApplicationStatus.Submitted;
    public int CurrentStep { get; set; } = 1;
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DueAt { get; set; }

    public User Citizen { get; set; } = null!;
    public ServiceType ServiceType { get; set; } = null!;
    public ICollection<ApplicationDocument> Documents { get; set; } = new List<ApplicationDocument>();
    public ICollection<ApplicationStatusHistory> StatusHistory { get; set; } = new List<ApplicationStatusHistory>();
    public ICollection<ApplicationWorkflowStep> WorkflowSteps { get; set; } = new List<ApplicationWorkflowStep>();
    public ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();

    public static Application Create(Guid citizenId, Guid serviceTypeId, string friendlyApplicationId) => new()
    {
        Id = Guid.NewGuid(),
        FriendlyApplicationId = friendlyApplicationId,
        CitizenId = citizenId,
        ServiceTypeId = serviceTypeId,
        Status = ApplicationStatus.Submitted,
        CurrentStep = 1,
        SubmittedAt = DateTime.UtcNow
    };

    private static readonly ApplicationStatus[] TerminalStatuses =
        [ApplicationStatus.Approved, ApplicationStatus.Rejected];

    public static IReadOnlyList<Application> GetActiveApplications(
        IEnumerable<Application> applications,
        Guid municipalityId)
        => applications
            .Where(a => a.ServiceType.MunicipalityId == municipalityId
                && !TerminalStatuses.Contains(a.Status))
            .OrderBy(a => a.SubmittedAt)
            .ToList();

    public void InitializeWorkflowSteps(IEnumerable<WorkflowStep> templateSteps)
        => InitializeWorkflowSteps(templateSteps, _ => null);

    public void InitializeWorkflowSteps(
        IEnumerable<WorkflowStep> templateSteps,
        Func<int?, DateTime?> dueAtResolver)
    {
        foreach (var step in templateSteps.OrderBy(s => s.StepOrder))
        {
            WorkflowSteps.Add(new ApplicationWorkflowStep
            {
                Id = Guid.NewGuid(),
                ApplicationId = Id,
                WorkflowStepId = step.Id,
                StepOrder = step.StepOrder,
                ExpectedCompletionMinutes = step.ExpectedCompletionMinutes,
                DueAt = dueAtResolver(step.ExpectedCompletionMinutes),
                Status = step.StepOrder == 1
                    ? ApplicationStepStatus.WaitingToBePicked
                    : ApplicationStepStatus.Pending
            });
        }

        Status = ApplicationStatus.UnderReview;
    }

    public ApplicationWorkflowStep? GetCurrentStep()
        => WorkflowSteps
            .Where(s => s.Status != ApplicationStepStatus.Completed)
            .OrderBy(s => s.StepOrder)
            .FirstOrDefault();

    public void CompleteCurrentStep(Guid completedBy, string? comment)
    {
        var current = GetCurrentStep()
            ?? throw new InvalidOperationException("No active step to complete.");

        current.Status = ApplicationStepStatus.Completed;
        current.CompletedByUserId = completedBy;
        current.CompletedOn = DateTime.UtcNow;
        current.Comment = comment;

        var next = WorkflowSteps
            .Where(s => s.StepOrder > current.StepOrder)
            .OrderBy(s => s.StepOrder)
            .FirstOrDefault();

        if (next is not null)
        {
            next.Status = ApplicationStepStatus.WaitingToBePicked;
            CurrentStep = next.StepOrder;
            ChangeStatus(ApplicationStatus.UnderReview, completedBy, comment);
        }
        else
        {
            ChangeStatus(ApplicationStatus.Approved, completedBy, comment);
        }
    }

    public void RejectCurrentStep(Guid rejectedBy, string? comment)
    {
        var current = GetCurrentStep()
            ?? throw new InvalidOperationException("No active step to reject.");

        current.Status = ApplicationStepStatus.Rejected;
        current.CompletedByUserId = rejectedBy;
        current.CompletedOn = DateTime.UtcNow;
        current.Comment = comment;

        ChangeStatus(ApplicationStatus.Rejected, rejectedBy, comment);
    }

    public void RequestDocumentsForCurrentStep(Guid requestedBy, string? comment)
    {
        var current = GetCurrentStep()
            ?? throw new InvalidOperationException("No active step to request documents for.");

        current.Status = ApplicationStepStatus.DocumentsRequested;
        current.Comment = comment;

        ChangeStatus(ApplicationStatus.DocumentsRequested, requestedBy, comment);
    }

    public void PickUpStep(Guid officerId)
    {
        var current = GetCurrentStep()
            ?? throw new InvalidOperationException("No active step to pick up.");

        if (current.Status != ApplicationStepStatus.WaitingToBePicked
            && current.Status != ApplicationStepStatus.DocumentsRequested)
            throw new InvalidOperationException($"Step is in '{current.Status}' status and cannot be picked up.");

        current.AssignedToUserId = officerId;
        current.AssignedOn = DateTime.UtcNow;
        current.Status = ApplicationStepStatus.InProgress;
    }

    public void ChangeStatus(ApplicationStatus newStatus, Guid changedBy, string? comment)
    {
        StatusHistory.Add(new ApplicationStatusHistory
        {
            ApplicationId = Id,
            Status = newStatus.ToString(),
            ChangedBy = changedBy,
            ChangedAt = DateTime.UtcNow,
            Comment = comment
        });
        Status = newStatus;
    }

    public void AddDocument(string documentName, string filePath)
    {
        Documents.Add(new ApplicationDocument
        {
            ApplicationId = Id,
            DocumentName = documentName,
            FilePath = filePath,
            UploadedAt = DateTime.UtcNow
        });
    }
}
