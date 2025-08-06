using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.BudgetDTOs.UpdateBudget
{
    public class UpdateBudgetCommand : IRequest<Unit>
    {
        public string BudgetId { get; }
        public UpdateBudgetDTO UpdatedBudget { get; }
        public UpdateBudgetCommand(string budgetId, UpdateBudgetDTO updatedBudget)
        {
            BudgetId = budgetId;
            UpdatedBudget = updatedBudget;
        }
    }
}
