using MediatR;

namespace Application.DTOs.BudgetDTOs.UpdateBudget
{
    public class CreateBudgetVersionCommand : IRequest<string>
    {
        public CreateBudgetVersionDTO? VersionDTO { get; set; }

        public CreateBudgetVersionCommand(CreateBudgetVersionDTO? dto)
        {
            VersionDTO = dto;
        }
    }
}
