//using MongoDB.Bson.Serialization.Attributes;
//using System;
//using System.Collections.Generic;
//using System.Linq;
//using System.Text;
//using System.Threading.Tasks;

//namespace Domain.Entities
//{
//    public class ProductType
//    {
//        [BsonIgnore]
//        public int Id { get; set; }
//        [BsonElement("name")]
//        public string? Name { get; set; } // Nombre del tipo (ej: "Abertura corrediza")

//        [BsonElement("category")]
//        public ProductCategory? Category { get; set; } // Categoría general (ej: "Aberturas")
//    }
//}