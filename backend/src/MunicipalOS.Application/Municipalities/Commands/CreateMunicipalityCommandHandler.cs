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

        var shortTrimmed = command.ShortName.Trim();
        if (shortTrimmed.Length is < 1 or > 5)
            return Result<CreateMunicipalityResult>.Failure(
                "Short name must be between 1 and 5 characters.");

        foreach (var c in shortTrimmed)
        {
            if (!char.IsLetterOrDigit(c))
                return Result<CreateMunicipalityResult>.Failure(
                    "Short name must contain only letters and digits.");
        }

        var shortUpper = shortTrimmed.ToUpperInvariant();
        if (await _repo.ExistsByShortNameAsync(shortUpper, ct))
            return Result<CreateMunicipalityResult>.Failure(
                $"A municipality with short name '{shortUpper}' already exists.");

        var municipality = Municipality.Create(command.MunicipalityName, shortUpper);
        var created = await _repo.AddAsync(municipality, ct);

        return Result<CreateMunicipalityResult>.Success(
            new CreateMunicipalityResult(created.Id, created.Name, created.ShortName!));
    }
}
