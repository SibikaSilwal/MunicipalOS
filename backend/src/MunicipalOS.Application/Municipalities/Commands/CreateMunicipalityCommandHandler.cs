using MunicipalOS.Application.Common;
using MunicipalOS.Application.Common.Interfaces;

namespace MunicipalOS.Application.Municipalities.Commands;

public class CreateMunicipalityCommandHandler
    : ICommandHandler<CreateMunicipalityCommand, Result<CreateMunicipalityResult>>
{
    private readonly IMunicipalityRepository _repo;

    public CreateMunicipalityCommandHandler(IMunicipalityRepository repo) => _repo = repo;

    public async Task<Result<CreateMunicipalityResult>> HandleAsync(
        CreateMunicipalityCommand command, CancellationToken ct = default)
    {
        if (await _repo.ExistsByNameAsync(command.MunicipalityName, ct))
            return Result<CreateMunicipalityResult>.Failure(
                $"A municipality named '{command.MunicipalityName}' already exists.");

        var municipality = Municipality.Create(command.MunicipalityName);
        var created = await _repo.AddAsync(municipality, ct);

        return Result<CreateMunicipalityResult>.Success(
            new CreateMunicipalityResult(created.Id, created.Name));
    }
}
