using MediatR;
using Application.DTOs.BudgetDTOs.GetBudget;



namespace Application.DTOs.BudgetDTOs.GetAllBudgetByComplement
{
    public class GetAllBudgetByComplementQuery : IRequest<List<GetBudgetByIdBudgetDTO>> { }
    
}