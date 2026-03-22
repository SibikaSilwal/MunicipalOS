namespace MunicipalOS.Application.Common.Interfaces;

public interface IFileStorageService
{
    Task<string> UploadAsync(string fileName, Stream content, string contentType, CancellationToken ct = default);
    Task<Stream> DownloadAsync(string filePath, CancellationToken ct = default);
}
