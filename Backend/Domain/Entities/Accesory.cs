using Domain.Enums;
using MongoDB.Bson.Serialization.Attributes;

namespace Domain.Entities
{
    public class Accesory
    {
        [BsonIgnore]
        public int id { get; set; }
        public string name { get; set; }
        public MaterialUnit unit { get; set; }
    }
}