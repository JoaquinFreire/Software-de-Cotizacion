using MediatR;

namespace Application.DTOs.BudgetDTOs.ChangeBudgetStatus
{
    public class ChangeBudgetStatusCommand : IRequest<bool>
    {
        public string BudgetId { get; set; } = string.Empty;
        public ChangeBudgetStatusDTO ChangeBudgetStatusDTO { get; set; }

        public ChangeBudgetStatusCommand(string budgetId, ChangeBudgetStatusDTO changeBudgetStatusDTO)
        {
            BudgetId = budgetId;
            ChangeBudgetStatusDTO = changeBudgetStatusDTO;
        }
    }
}
