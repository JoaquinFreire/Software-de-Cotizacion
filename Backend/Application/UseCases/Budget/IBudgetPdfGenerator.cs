using Application.DTOs.CreateBudget;

namespace Application.UseCases.Budget
{
    public interface IBudgetPdfGenerator
    {
        byte[] Execute(CreateBudgetDTO budget);
    }
}
