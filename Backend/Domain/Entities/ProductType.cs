using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace Domain.Entities
{
    public class ProductType
    {
        [BsonIgnore][JsonIgnore]
        public int Id { get; set; }

        [BsonElement("nombre")]
        public string Name { get; set; } // Nombre del tipo (ej: "Abertura corrediza")

        [BsonElement("categoria")]
        public ProductCategory Category { get; set; } // Categoría general (ej: "Aberturas")
    }
}
