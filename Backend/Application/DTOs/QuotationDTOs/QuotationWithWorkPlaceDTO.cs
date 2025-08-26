namespace Application.DTOs.QuotationDTOs;

public class QuotationWithWorkPlaceDTO
{
    public int Id { get; set; }
    public DateTime CreationDate { get; set; }
    public DateTime LastEdit { get; set; }
    public decimal TotalPrice { get; set; }
    public string Status { get; set; }
    public int WorkPlaceId { get; set; }
    public WorkPlaceDTO WorkPlace { get; set; }
    public CustomerDTO Customer { get; set; } // <--- Agregado
}

public class WorkPlaceDTO
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Location { get; set; }
    public string Address { get; set; }
    public int WorkTypeId { get; set; }
}

public class CustomerDTO
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Lastname { get; set; }
    public string Tel { get; set; }
    public string Mail { get; set; }
    public string Address { get; set; }
}
