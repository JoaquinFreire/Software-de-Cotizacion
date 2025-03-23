using Application.DTOs;

namespace Presentation.Request
{
    public class CreateBudgetRequest
    {
        public BudgetDTO? Budget { get; set; }
    }
}