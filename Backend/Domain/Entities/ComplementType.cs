using MongoDB.Bson.Serialization.Attributes;

namespace Domain.Entities;

public class ComplementType
{
    public int id { get; set; }
    public string? name { get; set; }
}
