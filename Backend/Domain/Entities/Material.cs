using Domain.Enums;
using MongoDB.Bson.Serialization.Attributes;

namespace Domain.Entities;
public class Material
{
    [BsonIgnore]
    public int id { get; set; }
    [BsonElement("name")]
    public string name { get; set; }
    [BsonElement("type")]
    public MaterialType type { get; set; }
    [BsonIgnore]
    public double price { get; set; }
    [BsonIgnore]
    public MaterialUnit unit { get; set; }
}
