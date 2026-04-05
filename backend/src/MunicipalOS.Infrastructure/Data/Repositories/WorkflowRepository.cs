using Microsoft.EntityFrameworkCore;
using MunicipalOS.Application.Common.Interfaces;

namespace MunicipalOS.Infrastructure.Data.Repositories;

public class WorkflowRepository : IWorkflowRepository
{
    private readonly AppDbContext _db;

    public WorkflowRepository(AppDbContext db) => _db = db;

    public async Task<WorkflowDefinition?> GetByServiceTypeIdAsync(Guid serviceTypeId, CancellationToken ct = default)
        => await _db.WorkflowDefinitions
            .AsNoTracking()
            .Include(w => w.ServiceType)
                .ThenInclude(s => s.Municipality)
            .Include(w => w.Steps.OrderBy(s => s.StepOrder))
            .FirstOrDefaultAsync(w => w.ServiceTypeId == serviceTypeId, ct);

    public async Task<WorkflowDefinition?> GetTrackedByServiceTypeIdAsync(Guid serviceTypeId, CancellationToken ct = default)
        => await _db.WorkflowDefinitions
            .Include(w => w.Steps.OrderBy(s => s.StepOrder))
            .FirstOrDefaultAsync(w => w.ServiceTypeId == serviceTypeId, ct);

    public async Task<WorkflowDefinition> AddAsync(WorkflowDefinition definition, CancellationToken ct = default)
    {
        _db.WorkflowDefinitions.Add(definition);
        await _db.SaveChangesAsync(ct);
        return definition;
    }

    public async Task ReplaceDefinitionStepsAsync(
        WorkflowDefinition definition,
        IReadOnlyList<(int StepOrder, string RoleRequired, string StepName, string? StepDescription, int? ExpectedCompletionMinutes)> steps,
        CancellationToken ct = default)
    {
        var existing = definition.Steps.ToList();
        if (existing.Count > 0)
        {
            _db.WorkflowSteps.RemoveRange(existing);
            definition.Steps.Clear();
            // Flush deletes before inserting replacements. A single SaveChanges that mixes
            // deletes + inserts on the same aggregate can produce UPDATEs that hit 0 rows
            // (DbUpdateConcurrencyException) due to change-tracking / batch ordering.
            await _db.SaveChangesAsync(ct);
        }
        else
        {
            definition.Steps.Clear();
        }

        foreach (var s in steps.OrderBy(x => x.StepOrder))
        {
            definition.Steps.Add(new WorkflowStep
            {
                Id = Guid.NewGuid(),
                WorkflowDefinitionId = definition.Id,
                StepOrder = s.StepOrder,
                RoleRequired = s.RoleRequired,
                StepName = s.StepName,
                StepDescription = s.StepDescription,
                ExpectedCompletionMinutes = s.ExpectedCompletionMinutes
            });
        }

        await _db.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(WorkflowDefinition definition, CancellationToken ct = default)
    {
        _db.WorkflowDefinitions.Remove(definition);
        await _db.SaveChangesAsync(ct);
    }
}
