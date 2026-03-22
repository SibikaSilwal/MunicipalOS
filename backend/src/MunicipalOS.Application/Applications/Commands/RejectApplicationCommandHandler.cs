using MunicipalOS.Application.Common;
using MunicipalOS.Application.Common.Interfaces;

namespace MunicipalOS.Application.Applications.Commands;

public class RejectApplicationCommandHandler
    : ICommandHandler<RejectApplicationCommand, Result<string>>
{
    private readonly IApplicationRepository _repo;

    public RejectApplicationCommandHandler(IApplicationRepository repo) => _repo = repo;

    public async Task<Result<string>> HandleAsync(
        RejectApplicationCommand command, CancellationToken ct = default)
    {
        var application = await _repo.GetByIdAsync(command.ApplicationId, ct);
        if (application is null)
            return Result<string>.Failure("Application not found.");

        var currentStep = application.GetCurrentStep();
        if (currentStep is null)
            return Result<string>.Failure("No active step to reject.");

        application.RejectCurrentStep(command.ChangedBy, command.Comment);
        await _repo.UpdateAsync(application, ct);

        return Result<string>.Success("Application rejected.");
    }
}
