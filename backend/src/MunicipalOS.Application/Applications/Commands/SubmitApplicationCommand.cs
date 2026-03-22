using MunicipalOS.Application.Common;

namespace MunicipalOS.Application.Applications.Commands;

public record SubmitApplicationCommand(
    Guid CitizenId,
    Guid ServiceTypeId) : ICommand<Result<SubmitApplicationResult>>;

public record SubmitApplicationResult(Guid Id);
