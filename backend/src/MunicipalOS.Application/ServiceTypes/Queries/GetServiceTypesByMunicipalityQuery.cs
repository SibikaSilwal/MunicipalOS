using MunicipalOS.Application.Common;

namespace MunicipalOS.Application.ServiceTypes.Queries;

public record GetServiceTypesByMunicipalityQuery(Guid MunicipalityId)
    : IQuery<IReadOnlyList<ServiceTypeDto>>;

public record ServiceTypeDto(
    Guid Id,
    string Name,
    string? Description,
    Guid MunicipalityId,
    List<RequiredDocumentDto> RequiredDocuments);

public record RequiredDocumentDto(Guid Id, string Name, bool Required);
