using Domain.Enums;
using MongoDB.Bson.Serialization.Attributes;

namespace Domain.Entities;

public class Complement
{
    [BsonIgnore]
    public int id { get; set; }
    [BsonElement("name")]
    public string? name { get; set; }
    [BsonIgnore]
    public double price { get; set; }
    public int type_id { get; set; }
    [BsonElement("type")]
    public ComplementType? type { get; set; }
    [BsonIgnore]
    public MaterialUnit unit { get; set; }
}
