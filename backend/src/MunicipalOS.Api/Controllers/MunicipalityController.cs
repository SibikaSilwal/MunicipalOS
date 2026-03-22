using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MunicipalOS.Application.Common;
using MunicipalOS.Application.Municipalities.Commands;
using MunicipalOS.Application.Municipalities.Queries;

namespace MunicipalOS.Api.Controllers;

[ApiController]
[Route("api/municipalities")]
public class MunicipalityController : ControllerBase
{
    private readonly IQueryHandler<GetMunicipalitiesQuery, IReadOnlyList<MunicipalityDto>> _getHandler;
    private readonly IQueryHandler<GetMunicipalityOfficersQuery, Result<IReadOnlyList<MunicipalityOfficerDto>>> _getOfficersHandler;
    private readonly ICommandHandler<CreateMunicipalityCommand, Result<CreateMunicipalityResult>> _createHandler;

    public MunicipalityController(
        IQueryHandler<GetMunicipalitiesQuery, IReadOnlyList<MunicipalityDto>> getHandler,
        IQueryHandler<GetMunicipalityOfficersQuery, Result<IReadOnlyList<MunicipalityOfficerDto>>> getOfficersHandler,
        ICommandHandler<CreateMunicipalityCommand, Result<CreateMunicipalityResult>> createHandler)
    {
        _getHandler = getHandler;
        _getOfficersHandler = getOfficersHandler;
        _createHandler = createHandler;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var result = await _getHandler.HandleAsync(new GetMunicipalitiesQuery(), ct);
        return Ok(result);
    }

    [HttpGet("{municipalityId:guid}/officers")]
    [AllowAnonymous]
    public async Task<IActionResult> GetOfficers(Guid municipalityId, CancellationToken ct)
    {
        var result = await _getOfficersHandler.HandleAsync(
            new GetMunicipalityOfficersQuery(municipalityId), ct);
        if (!result.IsSuccess)
            return NotFound(new { error = result.Error });

        return Ok(result.Value);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateMunicipalityCommand command, CancellationToken ct)
    {
        var result = await _createHandler.HandleAsync(command, ct);
        if (!result.IsSuccess)
            return Conflict(new { error = result.Error });

        return CreatedAtAction(nameof(GetAll), result.Value);
    }
}
