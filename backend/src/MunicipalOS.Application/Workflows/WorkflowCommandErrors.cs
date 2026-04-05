namespace MunicipalOS.Application.Workflows;

public static class WorkflowCommandErrors
{
    public const string NotFound = "Workflow not found.";
    public const string ConflictApplicationsExist =
        "Cannot change or delete this workflow while applications exist for this service type.";
    public const string StepsRequired = "Add at least one workflow step.";
}
