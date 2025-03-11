using Domain.Enums;
using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace Domain.Entities;
public class Material
{
    [BsonIgnore][JsonIgnore]
    public int id { get; set; }
    [BsonElement("nombre")]
    public string name { get; set; }
    [BsonElement("tipo")]
    public MaterialType type { get; set; }
    [BsonIgnore][JsonIgnore]
    public double price { get; set; }
}
