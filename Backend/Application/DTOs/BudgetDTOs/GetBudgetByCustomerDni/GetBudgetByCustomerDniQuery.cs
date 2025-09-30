using MediatR;
using Application.DTOs.BudgetDTOs.GetBudget;

namespace Application.DTOs.BudgetDTOs.GetBudgetByCustomerDni
{
    public record GetBudgetByCustomerDniQuery(string dni) : IRequest<List<GetBudgetByIdBudgetDTO>>
    {
    }
}
