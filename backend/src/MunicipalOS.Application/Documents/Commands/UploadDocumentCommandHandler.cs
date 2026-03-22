using MunicipalOS.Application.Common;
using MunicipalOS.Application.Common.Interfaces;

namespace MunicipalOS.Application.Documents.Commands;

public class UploadDocumentCommandHandler
    : ICommandHandler<UploadDocumentCommand, Result<UploadDocumentResult>>
{
    private readonly IApplicationRepository _appRepo;
    private readonly IFileStorageService _fileStorage;

    public UploadDocumentCommandHandler(
        IApplicationRepository appRepo, IFileStorageService fileStorage)
    {
        _appRepo = appRepo;
        _fileStorage = fileStorage;
    }

    public async Task<Result<UploadDocumentResult>> HandleAsync(
        UploadDocumentCommand command, CancellationToken ct = default)
    {
        var application = await _appRepo.GetByIdAsync(command.ApplicationId, ct);
        if (application is null)
            return Result<UploadDocumentResult>.Failure("Application not found.");

        var filePath = await _fileStorage.UploadAsync(
            command.FileName, command.Content, command.ContentType, ct);

        application.AddDocument(command.DocumentName, filePath);
        await _appRepo.UpdateAsync(application, ct);

        var doc = application.Documents.Last();
        return Result<UploadDocumentResult>.Success(
            new UploadDocumentResult(doc.Id, doc.DocumentName, doc.FilePath));
    }
}
