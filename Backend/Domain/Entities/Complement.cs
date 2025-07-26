using Domain.Enums;
using MongoDB.Bson.Serialization.Attributes;

namespace Domain.Entities;

public class Complement
{
    public List<BudgetComplementDoor>? ComplementDoor { get; set; } = new List<BudgetComplementDoor>();
    public List<BudgetComplementRailing>? ComplementRailing { get; set; } = new List<BudgetComplementRailing>();
    public List<BudgetComplementPartition> ComplementPartition { get; set; } = new List<BudgetComplementPartition>();
    public decimal price { get; set; } // Precio total de los complementos
}
