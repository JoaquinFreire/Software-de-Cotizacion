using MediatR;

namespace Application.DTOs.CreateBudget
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
