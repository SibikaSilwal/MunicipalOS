using Microsoft.EntityFrameworkCore;
using MunicipalOS.Application.Applications.Commands;
using MunicipalOS.Application.Common;
using MunicipalOS.Domain.Aggregates.Municipalities;
using MunicipalOS.Domain.Aggregates.Roles;
using MunicipalOS.Domain.Aggregates.ServiceTypes;
using MunicipalOS.Domain.Aggregates.Users;
using MunicipalOS.Domain.Aggregates.Workflows;
using MunicipalOS.Domain.Aggregates.Workflows.Entities;
using MunicipalOS.Domain.Enums;
using MunicipalOS.Infrastructure.Data;
using MunicipalOS.Infrastructure.Data.Repositories;
using MunicipalOS.Infrastructure.Services;

namespace MunicipalOS.Tests;

public class SubmitApplicationCommandHandlerTests
{
    [Fact]
    public async Task HandleAsync_ShouldFail_WhenMunicipalityShortNameMissing()
    {
        await using var db = CreateDbContext();
        var (userId, serviceTypeId) = await SeedMinimalWorkflowAsync(db, shortName: null);

        var handler = new SubmitApplicationCommandHandler(
            new ApplicationRepository(db),
            new WorkflowRepository(db),
            new NepalBusinessTimeCalculator(),
            new FriendlyApplicationIdGenerator());

        var result = await handler.HandleAsync(
            new SubmitApplicationCommand(userId, serviceTypeId));

        Assert.False(result.IsSuccess);
        Assert.Contains("short code", result.Error!, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(0, await db.Applications.CountAsync());
    }

    [Fact]
    public async Task HandleAsync_ShouldPersistFriendlyApplicationId_WhenShortNameSet()
    {
        await using var db = CreateDbContext();
        var (userId, serviceTypeId) = await SeedMinimalWorkflowAsync(db, shortName: "KTM");

        var handler = new SubmitApplicationCommandHandler(
            new ApplicationRepository(db),
            new WorkflowRepository(db),
            new NepalBusinessTimeCalculator(),
            new FriendlyApplicationIdGenerator());

        var result = await handler.HandleAsync(
            new SubmitApplicationCommand(userId, serviceTypeId));

        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Value);
        var app = await db.Applications.SingleAsync();
        Assert.Equal(app.FriendlyApplicationId, result.Value!.FriendlyApplicationId);
        Assert.StartsWith("NP-KTM-", app.FriendlyApplicationId, StringComparison.Ordinal);
    }

    private static async Task<(Guid userId, Guid serviceTypeId)> SeedMinimalWorkflowAsync(
        AppDbContext db,
        string? shortName)
    {
        var municipalityId = Guid.NewGuid();
        var roleId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var serviceTypeId = Guid.NewGuid();
        var workflowId = Guid.NewGuid();
        var stepId = Guid.NewGuid();

        db.Municipalities.Add(new Municipality
        {
            Id = municipalityId,
            Name = "Test City",
            ShortName = shortName,
        });
        db.Roles.Add(new Role { Id = roleId, Name = nameof(RoleName.Citizen) });
        db.Users.Add(new User
        {
            Id = userId,
            Email = "citizen@test.example",
            PasswordHash = "x",
            FullName = "Citizen",
            MunicipalityId = municipalityId,
            RoleId = roleId,
        });
        db.ServiceTypes.Add(new ServiceType
        {
            Id = serviceTypeId,
            Name = "Test service",
            MunicipalityId = municipalityId,
        });
        db.WorkflowDefinitions.Add(new WorkflowDefinition
        {
            Id = workflowId,
            ServiceTypeId = serviceTypeId,
        });
        db.WorkflowSteps.Add(new WorkflowStep
        {
            Id = stepId,
            WorkflowDefinitionId = workflowId,
            StepOrder = 1,
            RoleRequired = nameof(RoleName.WardOfficer),
            StepName = "Review",
        });

        await db.SaveChangesAsync();
        return (userId, serviceTypeId);
    }

    private static AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"submit-app-tests-{Guid.NewGuid():N}")
            .Options;
        return new AppDbContext(options);
    }
}
