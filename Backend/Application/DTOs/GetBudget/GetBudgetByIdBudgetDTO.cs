using Application.DTOs.GetBudget;
using Domain.Enums;

public class GetBudgetByIdBudgetDTO
{

    public string budgetId { get; set; }
    public string version { get; set; }
    public DateTime? creationDate { get; set; }
    public BudgetStatus? status { get; set; }
    public GetBudgetByIdUserDTO? user { get; set; }
    public GetBudgetByIdCustomerDTO customer { get; set; }
    public GetBudgetByIdWorkPlaceDTO? workPlace { get; set; }
    public List<GetBudgetByIdProductDTO> Products { get; set; }
    public List<GetBudgetByIdComplementDTO> Complement { get; set; }
    public DateTime? ExpirationDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string Comment { get; set; }
    public double DollarReference { get; set; }
    public double LabourReference { get; set; }
    public double Total { get; set; }
}
