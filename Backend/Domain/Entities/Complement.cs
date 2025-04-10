using Domain.Enums;
using MongoDB.Bson.Serialization.Attributes;

namespace Domain.Entities;

public class Complement
{
    [BsonIgnore]
    public int id { get; set; }
    [BsonElement("name")]
    public string? name { get; set; }
    [BsonElement("precio")]
    public double price { get; set; }
    [BsonIgnore]
    public int type_id { get; set; }
    [BsonIgnore]
    public ComplementType? type { get; set; }
    [BsonIgnore]
    public MaterialUnit unit { get; set; }
}
