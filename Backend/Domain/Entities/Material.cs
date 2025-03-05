using Domain.Enums;
using MongoDB.Bson.Serialization.Attributes;

namespace Domain.Entities;
public class Material
{
    [BsonIgnore]
    public int id { get; set; }
    [BsonElement("nombre")]
    public string name { get; set; }
    [BsonElement("tipo")]
    public MaterialType type { get; set; }
    [BsonElement("precio")]
    public double price { get; set; }
}
