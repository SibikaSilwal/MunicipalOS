using MunicipalOS.Application.Common;
using MunicipalOS.Application.Common.Interfaces;

namespace MunicipalOS.Application.Applications.Commands;

public class ApproveApplicationCommandHandler
    : ICommandHandler<ApproveApplicationCommand, Result<string>>
{
    private readonly IApplicationRepository _repo;

    public ApproveApplicationCommandHandler(IApplicationRepository repo) => _repo = repo;

    public async Task<Result<string>> HandleAsync(
        ApproveApplicationCommand command, CancellationToken ct = default)
    {
        var application = await _repo.GetByIdAsync(command.ApplicationId, ct);
        if (application is null)
            return Result<string>.Failure("Application not found.");

        var currentStep = application.GetCurrentStep();
        if (currentStep is null)
            return Result<string>.Failure("No active step to approve.");

        application.CompleteCurrentStep(command.ChangedBy, command.Comment);
        await _repo.UpdateAsync(application, ct);

        var isFullyApproved = application.Status == Domain.Enums.ApplicationStatus.Approved;
        return Result<string>.Success(isFullyApproved
            ? "Application approved."
            : $"Step '{currentStep.WorkflowStep?.StepName ?? currentStep.StepOrder.ToString()}' completed. Advanced to next step.");
    }
}
