using Application.DTOs;

namespace Presentation.Request
{
    public class CreateBudgetRequest
    {
        public BudgetDTO Budget { get; set; }
        public List<Budget_ProductDTO> Products { get; set; }
        public List<Budget_AccesoryDTO> Accesories { get; set; }
    }
}