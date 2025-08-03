using MongoDB.Bson.Serialization.Attributes;

namespace Domain.Entities
{
    public class GlassType
    {
        [BsonIgnore]
        public int id { get; set; }
        public string? name { get; set; }
        public decimal? price { get; set; }
    }
}
