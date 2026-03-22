using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MunicipalOS.Application.Common;
using MunicipalOS.Application.Documents.Commands;

namespace MunicipalOS.Api.Controllers;

[ApiController]
[Route("api/documents")]
[Authorize]
public class DocumentController : ControllerBase
{
    private readonly ICommandHandler<UploadDocumentCommand, Result<UploadDocumentResult>> _uploadHandler;

    public DocumentController(
        ICommandHandler<UploadDocumentCommand, Result<UploadDocumentResult>> uploadHandler)
        => _uploadHandler = uploadHandler;

    [HttpPost("upload")]
    [DisableRequestSizeLimit]
    public async Task<IActionResult> Upload(
        [FromForm] Guid applicationId,
        [FromForm] string documentName,
        IFormFile file,
        CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "No file provided." });

        await using var stream = file.OpenReadStream();
        var command = new UploadDocumentCommand(
            applicationId, documentName, file.FileName, stream, file.ContentType);

        var result = await _uploadHandler.HandleAsync(command, ct);
        if (!result.IsSuccess)
            return NotFound(new { error = result.Error });

        return Created($"/api/documents/{result.Value!.Id}", result.Value);
    }
}
