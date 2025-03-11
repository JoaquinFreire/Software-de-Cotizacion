using Domain.Enums;
using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace Domain.Entities;

public class MaterialCategory
{
    [BsonIgnore][JsonIgnore]
    public int id { get; set; }
    [BsonElement("nombre")]
    public string name { get; set; }
    [BsonElement("unidad de medida")]
    public MaterialUnit unit { get; set; }
}

