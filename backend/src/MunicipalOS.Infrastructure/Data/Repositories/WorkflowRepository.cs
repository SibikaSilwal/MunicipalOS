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
            .Include(w => w.Steps.OrderBy(s => s.StepOrder))
            .FirstOrDefaultAsync(w => w.ServiceTypeId == serviceTypeId, ct);

    public async Task<WorkflowDefinition> AddAsync(WorkflowDefinition definition, CancellationToken ct = default)
    {
        _db.WorkflowDefinitions.Add(definition);
        await _db.SaveChangesAsync(ct);
        return definition;
    }
}
