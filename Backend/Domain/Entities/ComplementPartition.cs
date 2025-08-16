using MongoDB.Bson.Serialization.Attributes;

namespace Domain.Entities
{
    public class ComplementPartition //Tabique
    {
        [BsonIgnore]
        public required int Id { get; set; }
        public required string name { get; set; }
        public decimal price { get; set; }
    }
}
