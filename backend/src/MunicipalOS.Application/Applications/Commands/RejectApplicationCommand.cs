using MunicipalOS.Application.Common;

namespace MunicipalOS.Application.Applications.Commands;

public record RejectApplicationCommand(
    Guid ApplicationId,
    Guid ChangedBy,
    string? Comment) : ICommand<Result<string>>;
