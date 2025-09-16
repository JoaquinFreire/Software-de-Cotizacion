using MongoDB.Bson.Serialization.Attributes;

namespace Domain.Entities
{
    public class Opening_Type
    {
        [BsonIgnore]
        public int id { get; set; }
        [BsonElement("name")]
        public required string name { get; set; }
        [BsonIgnore]
        public required double weight { get; set; }
        [BsonIgnore]
        public required double predefined_size { get; set; }
    }
}