namespace MunicipalOS.Application.Common.Interfaces;

public interface IAuditLogRepository
{
    Task AddAsync(AuditLog log, CancellationToken ct = default);
    Task<IReadOnlyList<AuditLog>> QueryAsync(
        Guid? userId = null,
        Guid? applicationId = null,
        string? eventType = null,
        DateTime? from = null,
        DateTime? to = null,
        int page = 1,
        int pageSize = 20,
        CancellationToken ct = default);
}
