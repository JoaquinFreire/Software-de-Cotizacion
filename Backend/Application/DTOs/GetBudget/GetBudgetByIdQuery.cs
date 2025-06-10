using Application.DTOs.GetBudget;
using MediatR;

namespace Application.Queries.Budget
{
    public record GetBudgetByBudgetIdQuery(string BudgetId) : IRequest<GetBudgetByIdDTO>;
}
