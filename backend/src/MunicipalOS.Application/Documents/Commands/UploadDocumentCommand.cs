using MunicipalOS.Application.Common;

namespace MunicipalOS.Application.Documents.Commands;

public record UploadDocumentCommand(
    Guid ApplicationId,
    string DocumentName,
    string FileName,
    Stream Content,
    string ContentType) : ICommand<Result<UploadDocumentResult>>;

public record UploadDocumentResult(Guid Id, string DocumentName, string FilePath);
