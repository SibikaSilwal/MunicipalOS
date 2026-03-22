using MunicipalOS.Application.Common;
using MunicipalOS.Application.Common.Interfaces;

namespace MunicipalOS.Application.ServiceTypes.Commands;

public class CreateServiceTypeCommandHandler
    : ICommandHandler<CreateServiceTypeCommand, Result<ServiceTypeCreatedResult>>
{
    private readonly IServiceTypeRepository _repo;

    public CreateServiceTypeCommandHandler(IServiceTypeRepository repo) => _repo = repo;

    public async Task<Result<ServiceTypeCreatedResult>> HandleAsync(
        CreateServiceTypeCommand command, CancellationToken ct = default)
    {
        var serviceType = ServiceType.Create(
            command.Name,
            command.Description,
            command.MunicipalityId,
            command.RequiredDocuments.Select(d => (d.Name, d.Required)));

        await _repo.AddAsync(serviceType, ct);

        return Result<ServiceTypeCreatedResult>.Success(
            new ServiceTypeCreatedResult(serviceType.Id, serviceType.Name));
    }
}
