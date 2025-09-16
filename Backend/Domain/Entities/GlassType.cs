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
        public required decimal price { get; set; }
    }
}
