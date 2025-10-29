namespace Application.DTOs.BudgetDTOs.CreateBudget
{
    public class CreateBudgetAccesoryDTO
    {
        public required string Name { get; set; }
        public int Quantity { get; set; }
        public decimal Price { get; set; } // Precio unitario del accesorio
    }
}
