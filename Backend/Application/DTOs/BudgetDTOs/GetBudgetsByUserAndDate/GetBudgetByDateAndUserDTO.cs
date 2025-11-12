namespace Application.DTOs.BudgetDTOs.GetBudgetsByUserAndDate
{
    public class GetBudgetByDateAndUserDTO
    {
        public DateTime FromDate { get; set; }
        public DateTime ToDate { get; set; }
        public string UserName { get; set; }
        public string UserLastName { get; set; }
    }
}