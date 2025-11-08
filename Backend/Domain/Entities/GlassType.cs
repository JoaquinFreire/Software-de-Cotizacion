using MongoDB.Bson.Serialization.Attributes;

namespace Domain.Entities
{
    public class GlassType
    {
        [BsonIgnore]
        public int id { get; set; }
        [BsonElement("nombre")]
        public required string name { get; set; }
        [BsonElement("precio")]
        public decimal price { get; set; }
        public string? description { get; set; }
    }
}
