using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace Domain.Entities
{
    public class ProductCategory
    {
        [BsonIgnore][JsonIgnore]
        public int Id { get; set; }

        [BsonElement("nombre")]
        public string Name { get; set; } // Nombre de la categoría (ej: "Aberturas")
    }
}
