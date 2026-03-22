using MunicipalOS.Application.Common;

namespace MunicipalOS.Application.Municipalities.Queries;

public record GetMunicipalitiesQuery : IQuery<IReadOnlyList<MunicipalityDto>>;

public record MunicipalityDto(Guid Id, string Name);
