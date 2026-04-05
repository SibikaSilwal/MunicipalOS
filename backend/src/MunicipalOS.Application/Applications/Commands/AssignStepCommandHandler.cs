using MunicipalOS.Application.Applications;
using MunicipalOS.Application.Common;
using MunicipalOS.Application.Common.Interfaces;

namespace MunicipalOS.Application.Applications.Commands;

public class AssignStepCommandHandler
    : ICommandHandler<AssignStepCommand, Result<string>>
{
    private readonly IApplicationRepository _repo;
    private readonly IUserRepository _userRepo;

    public AssignStepCommandHandler(IApplicationRepository repo, IUserRepository userRepo)
    {
        _repo = repo;
        _userRepo = userRepo;
    }

    public async Task<Result<string>> HandleAsync(
        AssignStepCommand command, CancellationToken ct = default)
    {
        var application = await _repo.GetByIdAsync(command.ApplicationId, ct);
        if (application is null)
            return Result<string>.Failure("Application not found.");

        var officer = await _userRepo.GetByIdAsync(command.OfficerId, ct);
        if (officer is null)
            return Result<string>.Failure("Officer not found.");

        var currentStep = application.GetCurrentStep();
        if (currentStep is null)
            return Result<string>.Failure("No active step to assign.");

        var roleError = WorkflowStepRoleGuard.GetRoleMismatchMessage(officer, currentStep);
        if (roleError is not null)
            return Result<string>.Failure(roleError);

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
            $"Step '{currentStep.WorkflowStep?.StepName ?? currentStep.StepOrder.ToString()}' assigned to {officer.FullName}.");
    }
}
