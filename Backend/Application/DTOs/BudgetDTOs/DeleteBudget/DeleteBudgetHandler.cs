using Application.Services;
using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.BudgetDTOs.DeleteBudget
{
    public class DeleteBudgetHandler : IRequestHandler<DeleteBudgetCommand, Unit>
    {
        private readonly BudgetServices _budgetServices;

        public DeleteBudgetHandler(BudgetServices budgetServices)
        {
            _budgetServices = budgetServices;
        }

        public async Task<Unit> Handle(DeleteBudgetCommand request, CancellationToken cancellationToken)
        {
            await _budgetServices.DeleteBudgetAsync(request.budgetId);
            return Unit.Value;
        }
    }

}
