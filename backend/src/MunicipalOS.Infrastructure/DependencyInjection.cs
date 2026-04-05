using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Minio;
using MunicipalOS.Application.Common;
using MunicipalOS.Application.Common.Interfaces;
using MunicipalOS.Infrastructure.Data;
using MunicipalOS.Infrastructure.Data.Repositories;
using MunicipalOS.Infrastructure.Services;

namespace MunicipalOS.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection"))
                   .UseSnakeCaseNamingConvention());

        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IApplicationRepository, ApplicationRepository>();
        services.AddScoped<IMunicipalityRepository, MunicipalityRepository>();
        services.AddScoped<IServiceTypeRepository, ServiceTypeRepository>();
        services.AddScoped<IWorkflowRepository, WorkflowRepository>();
        services.AddScoped<INotificationRepository, NotificationRepository>();
        services.AddScoped<IAuditLogRepository, AuditLogRepository>();
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IFileStorageService, MinioFileStorageService>();
        services.AddSingleton<ISlaBusinessTimeCalculator, NepalBusinessTimeCalculator>();
        services.AddSingleton<IFriendlyApplicationIdGenerator, FriendlyApplicationIdGenerator>();

        services.AddMinio(configureClient =>
        {
            configureClient
                .WithEndpoint(configuration["MinIO:Endpoint"] ?? "localhost:9000")
                .WithCredentials(
                    configuration["MinIO:AccessKey"] ?? "minioadmin",
                    configuration["MinIO:SecretKey"] ?? "minioadmin")
                .WithSSL(false);
        });

        return services;
    }
}
