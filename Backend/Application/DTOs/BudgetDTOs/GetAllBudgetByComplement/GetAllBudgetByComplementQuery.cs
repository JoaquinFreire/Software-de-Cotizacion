using MediatR;
using Application.DTOs.BudgetDTOs.GetBudget;



namespace Application.DTOs.BudgetDTOs.GetAllBudgetByComplement
{
    public class GetAllBudgetByComplementQuery : IRequest<List<GetBudgetByIdBudgetDTO>>
    {
        
        public DateTime FromDate { get; set; }
        public DateTime ToDate { get; set; }
    }
    
}