using Domain.Enums;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
namespace Domain.Entities;

public class Budget
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string id { get; set; }
    [BsonElement("creation_date")]
    public DateOnly creationDate { get; set; }
    [BsonElement("status")]
    public BudgetStatus status { get; set; }
    [BsonElement("total_price")]
    public double totalPrice { get; set; }
    [BsonElement("last_edit")]
    public DateOnly last_edit { get; set; }
    [BsonElement("employee")]
    public User employee { get; set; }
    [BsonElement("customer")]
    public Customer customer { get; set; }
    [BsonElement("workspace")]
    public WorkSpace workspace { get; set; }

}
