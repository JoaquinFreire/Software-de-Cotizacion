using Application.DTOs.CreateBudget;

namespace Application.UseCases
{
    public interface IBudgetPdfGenerator
    {
        byte[] Execute(CreateBudgetDTO budget);
    }
}
