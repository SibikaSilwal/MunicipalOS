using MunicipalOS.Application.Common;

namespace MunicipalOS.Application.Municipalities.Commands;

public record CreateMunicipalityCommand(string MunicipalityName) : ICommand<Result<CreateMunicipalityResult>>;

public record CreateMunicipalityResult(Guid Id, string Name);
