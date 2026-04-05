using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MunicipalOS.Api.Controllers;
using MunicipalOS.Application.Applications.Commands;
using MunicipalOS.Application.Applications.Queries;
using MunicipalOS.Application.Common;

namespace MunicipalOS.Tests;

public class ApplicationControllerSlaAccessTests
{
    [Fact]
    public async Task GetSlaMetrics_ShouldReturnForbid_ForCitizenRole()
    {
        var slaQueryHandler = new CapturingSlaQueryHandler();
        var controller = BuildController(slaQueryHandler);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = BuildUserPrincipal("Citizen", Guid.NewGuid())
            }
        };

        var result = await controller.GetSlaMetrics(null, null, null, false, CancellationToken.None);

        Assert.IsType<ForbidResult>(result);
    }

    [Fact]
    public async Task GetSlaMetrics_ShouldReturnForbid_ForMunicipalOfficerRole()
    {
        var municipalityId = Guid.NewGuid();
        var slaQueryHandler = new CapturingSlaQueryHandler();
        var controller = BuildController(slaQueryHandler);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = BuildUserPrincipal("MunicipalOfficer", municipalityId)
            }
        };

        var result = await controller.GetSlaMetrics(null, null, null, false, CancellationToken.None);

        Assert.IsType<ForbidResult>(result);
        Assert.Null(slaQueryHandler.LastQuery);
    }

    [Fact]
    public async Task GetSlaMetrics_ShouldUseMunicipalityClaim_ForAdminRole()
    {
        var municipalityId = Guid.NewGuid();
        var slaQueryHandler = new CapturingSlaQueryHandler();
        var controller = BuildController(slaQueryHandler);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = BuildUserPrincipal("Admin", municipalityId)
            }
        };

        var result = await controller.GetSlaMetrics(null, null, null, false, CancellationToken.None);

        Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(slaQueryHandler.LastQuery);
        Assert.Equal(municipalityId, slaQueryHandler.LastQuery!.MunicipalityId);
    }

    private static ApplicationController BuildController(CapturingSlaQueryHandler slaQueryHandler)
        => new(
            new NoOpCommandHandler<SubmitApplicationCommand, Result<SubmitApplicationResult>>(),
            new NoOpQueryHandler<GetMyApplicationsQuery, IReadOnlyList<ApplicationSummaryDto>>(),
            new NoOpQueryHandler<GetApplicationByIdQuery, Result<ApplicationDetailDto>>(),
            new NoOpQueryHandler<GetPendingApplicationsQuery, IReadOnlyList<ApplicationSummaryDto>>(),
            new NoOpQueryHandler<GetCompletedApplicationsQuery, IReadOnlyList<ApplicationSummaryDto>>(),
            new NoOpQueryHandler<GetMunicipalityApplicationsQuery, IReadOnlyList<ApplicationSummaryDto>>(),
            new NoOpCommandHandler<ApproveApplicationCommand, Result<string>>(),
            new NoOpCommandHandler<RejectApplicationCommand, Result<string>>(),
            new NoOpCommandHandler<RequestDocumentsCommand, Result<string>>(),
            new NoOpCommandHandler<PickUpStepCommand, Result<string>>(),
            new NoOpCommandHandler<AssignStepCommand, Result<string>>(),
            slaQueryHandler,
            new NoOpQueryHandler<GetSlaDashboardQuery, SlaDashboardDto>(),
            new NoOpQueryHandler<GetSlaApplicationReportQuery, PagedSlaApplicationsDto>());

    private static ClaimsPrincipal BuildUserPrincipal(string role, Guid municipalityId)
    {
        var claims = new[]
        {
            new Claim("role", role),
            new Claim("municipalityId", municipalityId.ToString()),
            new Claim(JwtRegisteredClaimNames.Sub, Guid.NewGuid().ToString())
        };

        return new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
    }

    private sealed class NoOpCommandHandler<TCommand, TResult> : ICommandHandler<TCommand, TResult>
        where TCommand : ICommand<TResult>
    {
        public Task<TResult> HandleAsync(TCommand command, CancellationToken ct = default)
            => throw new NotImplementedException();
    }

    private sealed class NoOpQueryHandler<TQuery, TResult> : IQueryHandler<TQuery, TResult>
        where TQuery : IQuery<TResult>
    {
        public Task<TResult> HandleAsync(TQuery query, CancellationToken ct = default)
            => throw new NotImplementedException();
    }

    private sealed class CapturingSlaQueryHandler : IQueryHandler<GetSlaMetricsQuery, SlaMetricsDto>
    {
        public GetSlaMetricsQuery? LastQuery { get; private set; }

        public Task<SlaMetricsDto> HandleAsync(GetSlaMetricsQuery query, CancellationToken ct = default)
        {
            LastQuery = query;
            return Task.FromResult(new SlaMetricsDto(
                DateTime.UtcNow.AddDays(-30),
                DateTime.UtcNow,
                10,
                8,
                2,
                80));
        }
    }
}
