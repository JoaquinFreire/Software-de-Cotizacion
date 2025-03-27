using MongoDB.Bson.Serialization.Attributes;

namespace Domain.Entities;

public class ComplementType
{
    [BsonIgnore]
    public int id { get; set; }
    [BsonElement("name")]
    public string? name { get; set; }
}
