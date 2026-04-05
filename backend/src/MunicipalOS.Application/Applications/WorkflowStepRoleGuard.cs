using MunicipalOS.Domain.Aggregates.Applications.Entities;
using MunicipalOS.Domain.Aggregates.Users;
using MunicipalOS.Domain.Enums;

namespace MunicipalOS.Application.Applications;

internal static class WorkflowStepRoleGuard
{
    public static string? GetRoleMismatchMessage(User? actor, ApplicationWorkflowStep? currentStep)
    {
        if (actor is null)
            return "User not found.";

        var required = currentStep?.WorkflowStep?.RoleRequired;
        if (string.IsNullOrWhiteSpace(required))
            return "This workflow step is missing required role configuration.";

        var actual = actor.Role?.Name;
        if (string.IsNullOrWhiteSpace(actual)
            || !string.Equals(actual, required.Trim(), StringComparison.Ordinal))
            return $"{FormatRoleName(required)} role is required for this step.";

        return null;
    }

    private static string FormatRoleName(string roleRequired) => roleRequired switch
    {
        nameof(RoleName.WardOfficer) => "Ward Officer",
        nameof(RoleName.MunicipalOfficer) => "Municipal Officer",
        nameof(RoleName.Citizen) => "Citizen",
        nameof(RoleName.Admin) => "Admin",
        _ => roleRequired
    };
}
