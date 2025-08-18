using MongoDB.Bson.Serialization.Attributes;

namespace Domain.Entities
{
    public class Opening_Type
    {
        [BsonIgnore]
        public int id { get; set; }
        [BsonElement("name")]
        public string? name { get; set; }
        [BsonIgnore]
        public double? weight { get; set; }
        [BsonIgnore]
        public double? predefined_size { get; set; }
    }
}