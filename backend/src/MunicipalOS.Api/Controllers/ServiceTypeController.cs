using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MunicipalOS.Application.Common;
using MunicipalOS.Application.ServiceTypes.Commands;
using MunicipalOS.Application.ServiceTypes.Queries;

namespace MunicipalOS.Api.Controllers;

[ApiController]
[Route("api/service-types")]
[Authorize]
public class ServiceTypeController : ControllerBase
{
    private readonly IQueryHandler<GetServiceTypesByMunicipalityQuery, IReadOnlyList<ServiceTypeDto>> _getHandler;
    private readonly ICommandHandler<CreateServiceTypeCommand, Result<ServiceTypeCreatedResult>> _createHandler;

    public ServiceTypeController(
        IQueryHandler<GetServiceTypesByMunicipalityQuery, IReadOnlyList<ServiceTypeDto>> getHandler,
        ICommandHandler<CreateServiceTypeCommand, Result<ServiceTypeCreatedResult>> createHandler)
    {
        _getHandler = getHandler;
        _createHandler = createHandler;
    }

    [HttpGet]
    public async Task<IActionResult> GetByMunicipality([FromQuery] Guid municipalityId, CancellationToken ct)
    {
        var result = await _getHandler.HandleAsync(
            new GetServiceTypesByMunicipalityQuery(municipalityId), ct);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateServiceTypeCommand command, CancellationToken ct)
    {
        var result = await _createHandler.HandleAsync(command, ct);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return Created($"/api/service-types/{result.Value!.Id}", result.Value);
    }
}
