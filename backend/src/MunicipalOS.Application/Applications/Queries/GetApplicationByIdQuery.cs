using MunicipalOS.Application.Common;

namespace MunicipalOS.Application.Applications.Queries;

public record GetApplicationByIdQuery(Guid Id) : IQuery<Result<ApplicationDetailDto>>;

public record ApplicationDetailDto(
    Guid Id,
    Guid CitizenId,
    string CitizenName,
    Guid ServiceTypeId,
    string ServiceTypeName,
    string Status,
    int CurrentStep,
    DateTime SubmittedAt,
    List<ApplicationDocumentDto> Documents,
    List<ApplicationStatusHistoryDto> StatusHistory,
    List<ApplicationWorkflowStepDto> WorkflowSteps);

public record ApplicationDocumentDto(Guid Id, string DocumentName, string FilePath, DateTime UploadedAt);

public record ApplicationStatusHistoryDto(
    Guid Id,
    string Status,
    Guid ChangedBy,
    DateTime ChangedAt,
    string? Comment);

public record ApplicationWorkflowStepDto(
    Guid Id,
    int StepOrder,
    string StepName,
    string? StepDescription,
    string RoleRequired,
    string Status,
    Guid? AssignedToUserId,
    string? AssignedToUserName,
    DateTime? AssignedOn,
    Guid? CompletedByUserId,
    string? CompletedByUserName,
    DateTime? CompletedOn,
    string? Comment);
