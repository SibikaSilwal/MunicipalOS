using MunicipalOS.Application.Common;

namespace MunicipalOS.Application.Applications.Commands;

public record PickUpStepCommand(
    Guid ApplicationId,
    Guid OfficerId) : ICommand<Result<string>>;
