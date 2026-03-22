using MunicipalOS.Application.Common;
using MunicipalOS.Application.Common.Interfaces;

namespace MunicipalOS.Application.Applications.Commands;

public class PickUpStepCommandHandler
    : ICommandHandler<PickUpStepCommand, Result<string>>
{
    private readonly IApplicationRepository _repo;

    public PickUpStepCommandHandler(IApplicationRepository repo) => _repo = repo;

    public async Task<Result<string>> HandleAsync(
        PickUpStepCommand command, CancellationToken ct = default)
    {
        var application = await _repo.GetByIdAsync(command.ApplicationId, ct);
        if (application is null)
            return Result<string>.Failure("Application not found.");

        var currentStep = application.GetCurrentStep();
        if (currentStep is null)
            return Result<string>.Failure("No active step to pick up.");

        try
        {
            application.PickUpStep(command.OfficerId);
        }
        catch (InvalidOperationException ex)
        {
            return Result<string>.Failure(ex.Message);
        }

        await _repo.UpdateAsync(application, ct);

        return Result<string>.Success(
            $"Step '{currentStep.WorkflowStep?.StepName ?? currentStep.StepOrder.ToString()}' picked up.");
    }
}
