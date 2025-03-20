using MongoDB.Bson.Serialization.Attributes;

namespace Domain.Entities
{
    public class ProductCategory
    {
        [BsonIgnore]
        public int Id { get; set; }
        [BsonElement("name")]
        public string Name { get; set; } // Nombre de la categoría (ej: "Aberturas")
    }
}