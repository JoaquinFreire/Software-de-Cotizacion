using MediatR;

namespace Application.DTOs.BudgetDTOs.CreateBudget
{
    public class CreateBudgetCommand : IRequest<string>
    {
        public CreateBudgetDTO? BudgetDTO { get; set; }

        public CreateBudgetCommand(CreateBudgetDTO? dto)
        {
            BudgetDTO = dto;
        }
    }
}
