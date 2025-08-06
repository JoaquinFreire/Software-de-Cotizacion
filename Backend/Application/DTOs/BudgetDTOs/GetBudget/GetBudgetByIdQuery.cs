using MediatR;

namespace Application.DTOs.BudgetDTOs.GetBudget
{
    public record GetBudgetByBudgetIdQuery(string BudgetId) : IRequest<GetBudgetByIdBudgetDTO>;
}
