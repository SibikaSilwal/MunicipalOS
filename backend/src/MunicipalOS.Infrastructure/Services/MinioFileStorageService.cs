using Microsoft.Extensions.Configuration;
using Minio;
using Minio.DataModel.Args;
using MunicipalOS.Application.Common.Interfaces;

namespace MunicipalOS.Infrastructure.Services;

public class MinioFileStorageService : IFileStorageService
{
    private readonly IMinioClient _minio;
    private readonly string _bucketName;

    public MinioFileStorageService(IMinioClient minio, IConfiguration configuration)
    {
        _minio = minio;
        _bucketName = configuration["MinIO:BucketName"] ?? "municipal-documents";
    }

    public async Task<string> UploadAsync(string fileName, Stream content, string contentType, CancellationToken ct = default)
    {
        var objectName = $"{Guid.NewGuid()}/{fileName}";

        var bucketExists = await _minio.BucketExistsAsync(
            new BucketExistsArgs().WithBucket(_bucketName), ct);

        if (!bucketExists)
        {
            await _minio.MakeBucketAsync(
                new MakeBucketArgs().WithBucket(_bucketName), ct);
        }

        await _minio.PutObjectAsync(new PutObjectArgs()
            .WithBucket(_bucketName)
            .WithObject(objectName)
            .WithStreamData(content)
            .WithObjectSize(content.Length)
            .WithContentType(contentType), ct);

        return objectName;
    }

    public async Task<Stream> DownloadAsync(string filePath, CancellationToken ct = default)
    {
        var ms = new MemoryStream();
        await _minio.GetObjectAsync(new GetObjectArgs()
            .WithBucket(_bucketName)
            .WithObject(filePath)
            .WithCallbackStream(stream => stream.CopyTo(ms)), ct);
        ms.Position = 0;
        return ms;
    }
}
