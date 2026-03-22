using MunicipalOS.Application.Common;

namespace MunicipalOS.Application.Applications.Commands;

public record RequestDocumentsCommand(
    Guid ApplicationId,
    Guid ChangedBy,
    string? Comment) : ICommand<Result<string>>;
