using Application.DTOs.BudgetDTOs.GetBudget;
using Domain.Enums;

public class GetBudgetByIdBudgetDTO
{

    public required string budgetId { get; set; }
    public required int version { get; set; }
    public DateTime? creationDate { get; set; }
    public BudgetStatus? status { get; set; }
    public GetBudgetByIdUserDTO? user { get; set; }
    public required GetBudgetByIdCustomerDTO customer { get; set; }
    public required GetBudgetByIdCustomerAgentDTO agent { get; set; }
    public required GetBudgetByIdWorkPlaceDTO? workPlace { get; set; }
    public required List<GetBudgetByIdProductDTO> Products { get; set; }
    public List<GetBudgetByIdComplementDTO>? Complement { get; set; }
    public DateTime? ExpirationDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? Comment { get; set; }
    public double DollarReference { get; set; }
    public double LabourReference { get; set; }
    public decimal Total { get; set; }
}
