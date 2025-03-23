using MongoDB.Bson.Serialization.Attributes;

namespace Domain.Entities;

public class MaterialCategory
{
    public int id { get; set; }
    public string? name { get; set; }
}

