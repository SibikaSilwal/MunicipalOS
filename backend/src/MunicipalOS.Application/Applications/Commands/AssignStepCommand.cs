using MunicipalOS.Application.Common;

namespace MunicipalOS.Application.Applications.Commands;

public record AssignStepCommand(
    Guid ApplicationId,
    Guid OfficerId) : ICommand<Result<string>>;
