using Application.DTOs.BudgetDTOs.ChangeBudgetStatus;
using Domain.Entities;
using Domain.Enums;
using Domain.Repositories;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.DTOs.BudgetDTOs.ChangeBudgetStatus
{
    public class ChangeBudgetStatusHandler : IRequestHandler<ChangeBudgetStatusCommand, bool>
    {
        private readonly IBudgetRepository _budgetRepository;
        private readonly IQuotationRepository _quotationRepository;
        private readonly ILogger<ChangeBudgetStatusHandler> _logger;

        public ChangeBudgetStatusHandler(
            IBudgetRepository budgetRepository,
            IQuotationRepository quotationRepository,
            ILogger<ChangeBudgetStatusHandler> logger)
        {
            _budgetRepository = budgetRepository;
            _quotationRepository = quotationRepository;
            _logger = logger;
        }

        public async Task<bool> Handle(ChangeBudgetStatusCommand request, CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogInformation("Cambiando estado de cotización con BudgetId: {BudgetId} a {Status}",
                    request.BudgetId, request.ChangeBudgetStatusDTO.Status);

                int SQLBudgetId = int.Parse(request.BudgetId);

                // 1. Validar que exista al menos una cotización con ese BudgetId
                var budgets = await _budgetRepository.GetBudgetsByBudgetIdAsync(request.BudgetId);
                if (!budgets.Any())
                {
                    _logger.LogWarning("No se encontraron cotizaciones con BudgetId: {BudgetId}", request.BudgetId);
                    return false;
                }

                // 2. Actualizar en MongoDB
                await _budgetRepository.ChangeBudgetStatus(
                    request.BudgetId,
                    request.ChangeBudgetStatusDTO.Status,
                    request.ChangeBudgetStatusDTO.Status == BudgetStatus.Rejected ?
                        request.ChangeBudgetStatusDTO.Comment : null
                );

                // 3. Actualizar en SQL
                await _quotationRepository.ChangeQuotationStatus(
                    SQLBudgetId,
                    request.ChangeBudgetStatusDTO.Status.ToString().ToLower()
                );

                _logger.LogInformation("Estado cambiado exitosamente para BudgetId: {BudgetId}", request.BudgetId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al cambiar estado de cotización con BudgetId: {BudgetId}", request.BudgetId);
                return false;
            }
        }
    }
}