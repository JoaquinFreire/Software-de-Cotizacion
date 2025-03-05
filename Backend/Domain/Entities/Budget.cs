using Domain.Enums;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
namespace Domain.Entities;

public class Budget
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string id { get; set; }
    [BsonElement("fecha_documento")]
    public DateTime creationDate { get; set; } = DateTime.UtcNow;
    [BsonElement("status")]
    [BsonRepresentation(BsonType.String)]
    public BudgetStatus status { get; set; }
    /*[BsonElement("total_price")]
    public double totalPrice { get; set; }*/
    [BsonElement("encargado_cotizacion")]
    public User user { get; set; }
    [BsonElement("cliente")]
    public Customer customer { get; set; }
    [BsonElement("workPlace")]
    public WorkPlace workPlace { get; set; }
    [BsonElement("productos")]
    public List<Budget_Product> Products { get; set; } = new List<Budget_Product>(); // Lista de productos

}
