using Domain.Enums;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using Domain.Services;
namespace Domain.Entities;

public class Budget
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? id { get; set; }
    [BsonElement("BudgetId")]
    public string budgetId  { get; set; }
    [BsonElement("file_date")]
    public DateTime? creationDate { get; set; } = DateTime.UtcNow;
    [BsonElement("status")]
    [BsonRepresentation(BsonType.String)]
    public BudgetStatus? status { get; set; } = BudgetStatus.Pending;
    [BsonElement("quotator")]
    public User? user { get; set; }
    [BsonElement("customer")]
    public Customer? customer { get; set; }
    [BsonElement("workPlace")]
    public WorkPlace? workPlace { get; set; }
    [BsonElement("products")]
    public List<Budget_Product> Products { get; set; } = new List<Budget_Product>(); // Lista de productos
    [BsonElement("expirationDate")]
    public DateTime? ExpirationDate { get; set; } = DateTime.UtcNow.AddDays(60); // Fecha de expiración por defecto X días después de la creación
    [BsonElement("endDate")]
    public DateTime? EndDate { get; set; } = null;
    [BsonElement("comment")]
    public string Comment { get; set; } = string.Empty;
    [BsonElement("dollarReference")]
    public double DollarReference { get; set; }  //Referencia del dolar
    [BsonElement("labourReference")]
    public double LabourReference { get; set; }  //Referencia de la mano de obra
    [BsonElement("total")]
    public double Total { get; set; }  //Total del presupuesto

    public Budget()
    {
        var generator = new RandomIdGenerator();
        budgetId = generator.GenerateRandomId(8); // Genera un ID aleatorio de 8 caracteres
    }
}