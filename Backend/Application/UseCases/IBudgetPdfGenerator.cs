using Application.DTOs;

namespace Application.UseCases
{
    public interface IBudgetPdfGenerator
    {
        byte[] Execute(BudgetDTO budget);
    }
}
