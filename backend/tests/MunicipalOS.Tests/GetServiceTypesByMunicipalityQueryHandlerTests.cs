using MunicipalOS.Application.Common.Interfaces;
using MunicipalOS.Application.ServiceTypes.Queries;
using MunicipalOS.Domain.Aggregates.ServiceTypes;
using MunicipalOS.Domain.Aggregates.Workflows;
using MunicipalOS.Domain.Aggregates.Workflows.Entities;

namespace MunicipalOS.Tests;

public class GetServiceTypesByMunicipalityQueryHandlerTests
{
    [Fact]
    public async Task HandleAsync_ShouldFallbackToWorkflowStepAggregate_WhenServiceSlaIsNull()
    {
        var municipalityId = Guid.NewGuid();
        var serviceType = new ServiceType
        {
            Id = Guid.NewGuid(),
            Name = "Migration Certificate",
            MunicipalityId = municipalityId,
            ExpectedCompletionMinutes = null,
            WorkflowDefinition = new WorkflowDefinition
            {
                Id = Guid.NewGuid(),
                Steps =
                [
                    new WorkflowStep { Id = Guid.NewGuid(), StepOrder = 1, RoleRequired = "WardOfficer", ExpectedCompletionMinutes = 120 },
                    new WorkflowStep { Id = Guid.NewGuid(), StepOrder = 2, RoleRequired = "MunicipalOfficer", ExpectedCompletionMinutes = 240 },
                    new WorkflowStep { Id = Guid.NewGuid(), StepOrder = 3, RoleRequired = "MunicipalOfficer", ExpectedCompletionMinutes = null }
                ]
            }
        };

        var handler = new GetServiceTypesByMunicipalityQueryHandler(
            new StubServiceTypeRepository([serviceType]));

        var result = await handler.HandleAsync(new GetServiceTypesByMunicipalityQuery(municipalityId));

        Assert.Single(result);
        Assert.Equal(360, result[0].ExpectedCompletionMinutes);
    }

    [Fact]
    public async Task HandleAsync_ShouldPreferServiceLevelSla_WhenPresent()
    {
        var municipalityId = Guid.NewGuid();
        var serviceType = new ServiceType
        {
            Id = Guid.NewGuid(),
            Name = "Recommendation Letter",
            MunicipalityId = municipalityId,
            ExpectedCompletionMinutes = 180,
            WorkflowDefinition = new WorkflowDefinition
            {
                Id = Guid.NewGuid(),
                Steps =
                [
                    new WorkflowStep { Id = Guid.NewGuid(), StepOrder = 1, RoleRequired = "WardOfficer", ExpectedCompletionMinutes = 60 },
                    new WorkflowStep { Id = Guid.NewGuid(), StepOrder = 2, RoleRequired = "MunicipalOfficer", ExpectedCompletionMinutes = 60 }
                ]
            }
        };

        var handler = new GetServiceTypesByMunicipalityQueryHandler(
            new StubServiceTypeRepository([serviceType]));

        var result = await handler.HandleAsync(new GetServiceTypesByMunicipalityQuery(municipalityId));

        Assert.Single(result);
        Assert.Equal(180, result[0].ExpectedCompletionMinutes);
    }

    private sealed class StubServiceTypeRepository : IServiceTypeRepository
    {
        private readonly IReadOnlyList<ServiceType> _serviceTypes;

        public StubServiceTypeRepository(IReadOnlyList<ServiceType> serviceTypes)
            => _serviceTypes = serviceTypes;

        public Task<IReadOnlyList<ServiceType>> GetByMunicipalityIdAsync(Guid municipalityId, CancellationToken ct = default)
            => Task.FromResult(_serviceTypes);

        public Task<ServiceType?> GetByIdAsync(Guid id, CancellationToken ct = default)
            => Task.FromResult(_serviceTypes.FirstOrDefault(s => s.Id == id));

        public Task<ServiceType> AddAsync(ServiceType serviceType, CancellationToken ct = default)
            => throw new NotImplementedException();

        public Task UpdateAsync(ServiceType serviceType, CancellationToken ct = default)
            => throw new NotImplementedException();
    }
}
