using Domain.Enums;
using MongoDB.Bson.Serialization.Attributes;

namespace Domain.Entities;

public class MaterialCategory
{
    [BsonIgnore]
    public int id { get; set; }
    [BsonElement("nombre")]
    public string name { get; set; }
    [BsonElement("unidad de medida")]
    public MaterialUnit unit { get; set; }
}

