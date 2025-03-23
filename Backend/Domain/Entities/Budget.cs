using Domain.Enums;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
namespace Domain.Entities;

public class Budget
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string id { get; set; }
    [BsonElement("file_date")]
    public DateTime? creationDate { get; set; } = DateTime.UtcNow;
    [BsonElement("status")]
    [BsonRepresentation(BsonType.String)]
    public BudgetStatus? status { get; set; }
    [BsonElement("quotator")]
    public User? user { get; set; }
    [BsonElement("customer")]
    public Customer? customer { get; set; }
    [BsonElement("workPlace")]
    public WorkPlace? workPlace { get; set; }
    [BsonElement("products")]
    public List<Budget_Product> Products { get; set; } = new List<Budget_Product>(); // Lista de productos

}