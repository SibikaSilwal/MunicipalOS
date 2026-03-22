using System.Reflection;
using Microsoft.Extensions.DependencyInjection;
using MunicipalOS.Application.Common;

namespace MunicipalOS.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = Assembly.GetExecutingAssembly();

        var handlerTypes = new[] { typeof(ICommandHandler<,>), typeof(IQueryHandler<,>) };

        foreach (var handlerType in handlerTypes)
        {
            var implementations = assembly.GetTypes()
                .Where(t => t is { IsAbstract: false, IsInterface: false })
                .SelectMany(t => t.GetInterfaces()
                    .Where(i => i.IsGenericType && i.GetGenericTypeDefinition() == handlerType)
                    .Select(i => new { Interface = i, Implementation = t }));

            foreach (var impl in implementations)
            {
                services.AddScoped(impl.Interface, impl.Implementation);
            }
        }

        return services;
    }
}
