using MunicipalOS.Application.Common;

namespace MunicipalOS.Application.Workflows.Commands;

public record DeleteWorkflowCommand(Guid ServiceTypeId) : ICommand<Result<bool>>;
