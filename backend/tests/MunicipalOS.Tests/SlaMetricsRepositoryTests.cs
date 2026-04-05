using Microsoft.EntityFrameworkCore;
using MunicipalOS.Domain.Aggregates.Applications;
using MunicipalOS.Domain.Aggregates.Applications.Entities;
using MunicipalOS.Domain.Aggregates.Municipalities;
using MunicipalOS.Domain.Aggregates.Roles;
using MunicipalOS.Domain.Aggregates.ServiceTypes;
using MunicipalOS.Domain.Aggregates.Users;
using MunicipalOS.Domain.Enums;
using MunicipalOS.Infrastructure.Data;
using MunicipalOS.Infrastructure.Data.Repositories;
using DomainApplication = MunicipalOS.Domain.Aggregates.Applications.Application;

namespace MunicipalOS.Tests;

public class SlaMetricsRepositoryTests
{
    [Fact]
    public async Task GetSlaMetricsAsync_ShouldReturnExpectedWithinAndBreachedCounts()
    {
        await using var db = CreateDbContext();
        var repository = new ApplicationRepository(db);

        var municipalityId = Guid.NewGuid();
        var serviceTypeId = Guid.NewGuid();
        var roleId = Guid.NewGuid();
        var userId = Guid.NewGuid();

        db.Municipalities.Add(new Municipality { Id = municipalityId, Name = "Kathmandu", ShortName = "KTM" });
        db.Roles.Add(new Role { Id = roleId, Name = nameof(RoleName.Citizen) });
        db.Users.Add(new User
        {
            Id = userId,
            Email = "citizen@example.com",
            PasswordHash = "hash",
            FullName = "Citizen",
            MunicipalityId = municipalityId,
            RoleId = roleId
        });

        db.ServiceTypes.Add(new ServiceType
        {
            Id = serviceTypeId,
            Name = "Migration certificate",
            MunicipalityId = municipalityId,
            ExpectedCompletionMinutes = 120
        });

        var now = DateTime.UtcNow;

        var onTimeApplication = new DomainApplication
        {
            Id = Guid.NewGuid(),
            FriendlyApplicationId = "NP-KTM-00-aaaaaa",
            CitizenId = userId,
            ServiceTypeId = serviceTypeId,
            Status = ApplicationStatus.Approved,
            SubmittedAt = now.AddDays(-3),
            DueAt = now.AddDays(-1)
        };

        var breachedApplication = new DomainApplication
        {
            Id = Guid.NewGuid(),
            FriendlyApplicationId = "NP-KTM-00-bbbbbb",
            CitizenId = userId,
            ServiceTypeId = serviceTypeId,
            Status = ApplicationStatus.Approved,
            SubmittedAt = now.AddDays(-3),
            DueAt = now.AddDays(-2)
        };

        db.Applications.AddRange(onTimeApplication, breachedApplication);
        db.ApplicationStatusHistories.AddRange(
            new ApplicationStatusHistory
            {
                Id = Guid.NewGuid(),
                ApplicationId = onTimeApplication.Id,
                Status = ApplicationStatus.Approved.ToString(),
                ChangedBy = userId,
                ChangedAt = now.AddDays(-2),
                Comment = "On time"
            },
            new ApplicationStatusHistory
            {
                Id = Guid.NewGuid(),
                ApplicationId = breachedApplication.Id,
                Status = ApplicationStatus.Approved.ToString(),
                ChangedBy = userId,
                ChangedAt = now.AddDays(-1),
                Comment = "Late"
            });

        await db.SaveChangesAsync();

        var metrics = await repository.GetSlaMetricsAsync(
            municipalityId,
            now.AddDays(-10),
            now,
            null,
            includeRejected: false);

        Assert.Equal(2, metrics.TotalCompleted);
        Assert.Equal(1, metrics.CompletedWithinSla);
        Assert.Equal(1, metrics.Breached);
        Assert.Equal(50, metrics.PercentCompletedWithinSla);
    }

    [Fact]
    public async Task GetSlaBreakdownByServiceAsync_ShouldGroupByService()
    {
        await using var db = CreateDbContext();
        var repository = new ApplicationRepository(db);

        var municipalityId = Guid.NewGuid();
        var serviceA = Guid.NewGuid();
        var serviceB = Guid.NewGuid();
        var roleId = Guid.NewGuid();
        var userId = Guid.NewGuid();

        db.Municipalities.Add(new Municipality { Id = municipalityId, Name = "Kathmandu", ShortName = "KTM" });
        db.Roles.Add(new Role { Id = roleId, Name = nameof(RoleName.Citizen) });
        db.Users.Add(new User
        {
            Id = userId,
            Email = "c@example.com",
            PasswordHash = "h",
            FullName = "Citizen",
            MunicipalityId = municipalityId,
            RoleId = roleId
        });

        db.ServiceTypes.AddRange(
            new ServiceType { Id = serviceA, Name = "Service A", MunicipalityId = municipalityId },
            new ServiceType { Id = serviceB, Name = "Service B", MunicipalityId = municipalityId });

        var now = DateTime.UtcNow;

        var appA = new DomainApplication
        {
            Id = Guid.NewGuid(),
            FriendlyApplicationId = "NP-KTM-00-cccccc",
            CitizenId = userId,
            ServiceTypeId = serviceA,
            Status = ApplicationStatus.Approved,
            SubmittedAt = now.AddDays(-2),
            DueAt = now.AddDays(1)
        };
        var appB = new DomainApplication
        {
            Id = Guid.NewGuid(),
            FriendlyApplicationId = "NP-KTM-00-dddddd",
            CitizenId = userId,
            ServiceTypeId = serviceB,
            Status = ApplicationStatus.Approved,
            SubmittedAt = now.AddDays(-2),
            DueAt = now.AddDays(1)
        };

        db.Applications.AddRange(appA, appB);
        db.ApplicationStatusHistories.AddRange(
            new ApplicationStatusHistory
            {
                Id = Guid.NewGuid(),
                ApplicationId = appA.Id,
                Status = ApplicationStatus.Approved.ToString(),
                ChangedBy = userId,
                ChangedAt = now.AddDays(-1)
            },
            new ApplicationStatusHistory
            {
                Id = Guid.NewGuid(),
                ApplicationId = appB.Id,
                Status = ApplicationStatus.Approved.ToString(),
                ChangedBy = userId,
                ChangedAt = now.AddDays(-1)
            });

        await db.SaveChangesAsync();

        var rows = await repository.GetSlaBreakdownByServiceAsync(
            municipalityId, now.AddDays(-5), now, null, false);

        Assert.Equal(2, rows.Count);
        Assert.Contains(rows, r => r.ServiceTypeId == serviceA && r.TotalCompleted == 1);
        Assert.Contains(rows, r => r.ServiceTypeId == serviceB && r.TotalCompleted == 1);
    }

    [Fact]
    public async Task GetSlaBreakdownByTerminalOfficerAsync_ShouldResolveNames()
    {
        await using var db = CreateDbContext();
        var repository = new ApplicationRepository(db);

        var municipalityId = Guid.NewGuid();
        var serviceTypeId = Guid.NewGuid();
        var citizenRoleId = Guid.NewGuid();
        var officerRoleId = Guid.NewGuid();
        var citizenId = Guid.NewGuid();
        var officer1 = Guid.NewGuid();
        var officer2 = Guid.NewGuid();

        db.Municipalities.Add(new Municipality { Id = municipalityId, Name = "Kathmandu", ShortName = "KTM" });
        db.Roles.AddRange(
            new Role { Id = citizenRoleId, Name = nameof(RoleName.Citizen) },
            new Role { Id = officerRoleId, Name = nameof(RoleName.MunicipalOfficer) });
        db.Users.AddRange(
            new User
            {
                Id = citizenId,
                Email = "c@example.com",
                PasswordHash = "h",
                FullName = "Citizen",
                MunicipalityId = municipalityId,
                RoleId = citizenRoleId
            },
            new User
            {
                Id = officer1,
                Email = "o1@example.com",
                PasswordHash = "h",
                FullName = "Officer One",
                MunicipalityId = municipalityId,
                RoleId = officerRoleId
            },
            new User
            {
                Id = officer2,
                Email = "o2@example.com",
                PasswordHash = "h",
                FullName = "Officer Two",
                MunicipalityId = municipalityId,
                RoleId = officerRoleId
            });

        db.ServiceTypes.Add(new ServiceType
        {
            Id = serviceTypeId,
            Name = "Svc",
            MunicipalityId = municipalityId
        });

        var now = DateTime.UtcNow;
        var app1 = new DomainApplication
        {
            Id = Guid.NewGuid(),
            FriendlyApplicationId = "NP-KTM-00-eeeeee",
            CitizenId = citizenId,
            ServiceTypeId = serviceTypeId,
            Status = ApplicationStatus.Approved,
            SubmittedAt = now.AddDays(-2),
            DueAt = now.AddDays(1)
        };
        var app2 = new DomainApplication
        {
            Id = Guid.NewGuid(),
            FriendlyApplicationId = "NP-KTM-00-ffffff",
            CitizenId = citizenId,
            ServiceTypeId = serviceTypeId,
            Status = ApplicationStatus.Approved,
            SubmittedAt = now.AddDays(-2),
            DueAt = now.AddDays(1)
        };

        db.Applications.AddRange(app1, app2);
        db.ApplicationStatusHistories.AddRange(
            new ApplicationStatusHistory
            {
                Id = Guid.NewGuid(),
                ApplicationId = app1.Id,
                Status = ApplicationStatus.Approved.ToString(),
                ChangedBy = officer1,
                ChangedAt = now.AddDays(-1)
            },
            new ApplicationStatusHistory
            {
                Id = Guid.NewGuid(),
                ApplicationId = app2.Id,
                Status = ApplicationStatus.Approved.ToString(),
                ChangedBy = officer2,
                ChangedAt = now.AddHours(-2)
            });

        await db.SaveChangesAsync();

        var rows = await repository.GetSlaBreakdownByTerminalOfficerAsync(
            municipalityId, now.AddDays(-5), now, null, false);

        Assert.Equal(2, rows.Count);
        var r1 = rows.Single(r => r.TerminalOfficerId == officer1);
        Assert.Equal("Officer One", r1.TerminalOfficerName);
        var r2 = rows.Single(r => r.TerminalOfficerId == officer2);
        Assert.Equal("Officer Two", r2.TerminalOfficerName);
    }

    [Fact]
    public async Task GetSlaApplicationRowsAsync_ShouldPageAndFilterWithinSla()
    {
        await using var db = CreateDbContext();
        var repository = new ApplicationRepository(db);

        var municipalityId = Guid.NewGuid();
        var serviceTypeId = Guid.NewGuid();
        var roleId = Guid.NewGuid();
        var userId = Guid.NewGuid();

        db.Municipalities.Add(new Municipality { Id = municipalityId, Name = "Kathmandu", ShortName = "KTM" });
        db.Roles.Add(new Role { Id = roleId, Name = nameof(RoleName.Citizen) });
        db.Users.Add(new User
        {
            Id = userId,
            Email = "c@example.com",
            PasswordHash = "h",
            FullName = "Citizen",
            MunicipalityId = municipalityId,
            RoleId = roleId
        });
        db.ServiceTypes.Add(new ServiceType
        {
            Id = serviceTypeId,
            Name = "Svc",
            MunicipalityId = municipalityId
        });

        var now = DateTime.UtcNow;

        var late = new DomainApplication
        {
            Id = Guid.NewGuid(),
            FriendlyApplicationId = "NP-KTM-00-gggggg",
            CitizenId = userId,
            ServiceTypeId = serviceTypeId,
            Status = ApplicationStatus.Approved,
            SubmittedAt = now.AddDays(-3),
            DueAt = now.AddDays(-2)
        };
        var onTime = new DomainApplication
        {
            Id = Guid.NewGuid(),
            FriendlyApplicationId = "NP-KTM-00-hhhhhh",
            CitizenId = userId,
            ServiceTypeId = serviceTypeId,
            Status = ApplicationStatus.Approved,
            SubmittedAt = now.AddDays(-3),
            DueAt = now.AddDays(1)
        };

        db.Applications.AddRange(late, onTime);
        db.ApplicationStatusHistories.AddRange(
            new ApplicationStatusHistory
            {
                Id = Guid.NewGuid(),
                ApplicationId = late.Id,
                Status = ApplicationStatus.Approved.ToString(),
                ChangedBy = userId,
                ChangedAt = now.AddDays(-1)
            },
            new ApplicationStatusHistory
            {
                Id = Guid.NewGuid(),
                ApplicationId = onTime.Id,
                Status = ApplicationStatus.Approved.ToString(),
                ChangedBy = userId,
                ChangedAt = now.AddDays(-1)
            });

        await db.SaveChangesAsync();

        var page1 = await repository.GetSlaApplicationRowsAsync(
            municipalityId, now.AddDays(-10), now, null, false,
            page: 1, pageSize: 1,
            withinSlaOnly: false, breachedOnly: false, terminalOfficerId: null);

        Assert.Equal(2, page1.TotalCount);
        Assert.Single(page1.Items);

        var withinOnly = await repository.GetSlaApplicationRowsAsync(
            municipalityId, now.AddDays(-10), now, null, false,
            page: 1, pageSize: 10,
            withinSlaOnly: true, breachedOnly: false, terminalOfficerId: null);

        Assert.Single(withinOnly.Items);
        Assert.True(withinOnly.Items[0].WithinSla);
        Assert.Equal(onTime.Id, withinOnly.Items[0].ApplicationId);
        Assert.Equal("NP-KTM-00-hhhhhh", withinOnly.Items[0].FriendlyApplicationId);
    }

    private static AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"sla-metrics-tests-{Guid.NewGuid():N}")
            .Options;
        return new AppDbContext(options);
    }
}
