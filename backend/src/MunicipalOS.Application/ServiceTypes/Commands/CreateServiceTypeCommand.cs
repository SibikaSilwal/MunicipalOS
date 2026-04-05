using MunicipalOS.Application.Common;

namespace MunicipalOS.Application.ServiceTypes.Commands;

public record CreateServiceTypeCommand(
    string Name,
    string? Description,
    Guid MunicipalityId,
    List<RequiredDocumentInput> RequiredDocuments,
    int? ExpectedCompletionMinutes = null) : ICommand<Result<ServiceTypeCreatedResult>>;

public record RequiredDocumentInput(string Name, bool Required);

public record ServiceTypeCreatedResult(Guid Id, string Name);
