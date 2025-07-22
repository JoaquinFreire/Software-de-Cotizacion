using MediatR;

namespace Application.DTOs.DeleteBudget
{
    public class DeleteBudgetCommand : IRequest<Unit>
    {
        public string budgetId { get; }

        public DeleteBudgetCommand(string budgetId)
        {
            this.budgetId = budgetId;
        }
    }
}
