using Domain.Enums;
using MongoDB.Bson.Serialization.Attributes;

namespace Domain.Entities;

public class Complement
{
    public List<BudgetComplementDoor>? ComplementDoor { get; set; }
    public List<BudgetComplementRailing>? ComplementRailing { get; set; }
    public List<BudgetComplementPartition>? ComplementPartition { get; set; }
    public decimal price { get; set; } // Precio total de los complementos
}
