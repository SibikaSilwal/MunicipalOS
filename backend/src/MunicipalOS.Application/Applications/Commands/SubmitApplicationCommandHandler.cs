using MunicipalOS.Application.Common;
using MunicipalOS.Application.Common.Interfaces;

namespace MunicipalOS.Application.Applications.Commands;

public class SubmitApplicationCommandHandler
    : ICommandHandler<SubmitApplicationCommand, Result<SubmitApplicationResult>>
{
    private readonly IApplicationRepository _repo;
    private readonly IWorkflowRepository _workflowRepo;
    private readonly ISlaBusinessTimeCalculator _slaBusinessTimeCalculator;
    private readonly IFriendlyApplicationIdGenerator _friendlyApplicationIdGenerator;

    public SubmitApplicationCommandHandler(
        IApplicationRepository repo,
        IWorkflowRepository workflowRepo,
        ISlaBusinessTimeCalculator slaBusinessTimeCalculator,
        IFriendlyApplicationIdGenerator friendlyApplicationIdGenerator)
    {
        _repo = repo;
        _workflowRepo = workflowRepo;
        _slaBusinessTimeCalculator = slaBusinessTimeCalculator;
        _friendlyApplicationIdGenerator = friendlyApplicationIdGenerator;
    }

    public async Task<Result<SubmitApplicationResult>> HandleAsync(
        SubmitApplicationCommand command, CancellationToken ct = default)
    {
        var workflow = await _workflowRepo.GetByServiceTypeIdAsync(command.ServiceTypeId, ct);
        if (workflow is null || workflow.Steps.Count == 0)
            return Result<SubmitApplicationResult>.Failure("No workflow defined for this service type.");

        var shortRaw = workflow.ServiceType.Municipality.ShortName?.Trim();
        if (string.IsNullOrEmpty(shortRaw))
            return Result<SubmitApplicationResult>.Failure(
                "This municipality does not have a short code configured; applications cannot be submitted until an administrator sets one.");

        var munUpper = shortRaw.ToUpperInvariant();

        string friendlyId;
        const int maxAttempts = 10;
        var attempt = 0;
        do
        {
            attempt++;
            var candidate = _friendlyApplicationIdGenerator.BuildCandidate(munUpper, DateTime.UtcNow);
            if (!await _repo.FriendlyApplicationIdExistsAsync(candidate, ct))
            {
                friendlyId = candidate;
                break;
            }

            if (attempt >= maxAttempts)
                return Result<SubmitApplicationResult>.Failure(
                    "Could not allocate a unique application reference; please try again.");
        } while (true);

        var application = DomainApplication.Create(command.CitizenId, command.ServiceTypeId, friendlyId);

        if (workflow.ServiceType.ExpectedCompletionMinutes is > 0)
        {
            application.DueAt = _slaBusinessTimeCalculator.AddNepalBusinessMinutes(
                application.SubmittedAt,
                workflow.ServiceType.ExpectedCompletionMinutes.Value);
        }

        application.InitializeWorkflowSteps(
            workflow.Steps,
            stepExpectedMinutes => stepExpectedMinutes is > 0
                ? _slaBusinessTimeCalculator.AddNepalBusinessMinutes(
                    application.SubmittedAt,
                    stepExpectedMinutes.Value)
                : null);

        await _repo.AddAsync(application, ct);

        return Result<SubmitApplicationResult>.Success(
            new SubmitApplicationResult(application.Id, application.FriendlyApplicationId));
    }
}
