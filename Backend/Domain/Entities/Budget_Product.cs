using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Domain.Entities
{
    public class Budget_Product
    {
        //[BsonElement("productName")]
        //public string? Name { get; set; }
        //[BsonElement("type")]
        //public ProductType? Type { get; set; } // Tipo específico del producto
        [BsonElement("Product")]
        public Opening_Type? OpeningType { get; set; }
        [BsonElement("quantity")]
        public int? Quantity { get; set; }
        [BsonElement("aluminiumType")]
        public Complement? AlumComplement { get; set; }  //Tiene que almacenar el tipo de aluminio
        [BsonElement("AluminiumTreatment")]
        public AlumTreatment? AlumTreatment { get; set; }  //Tiene que almacenar el tratamiento de aluminio
        [BsonElement("glassType")]
        public Complement? GlassComplement { get; set; }  //Tiene que almacenar el tipo de vidrio
        [BsonElement("width")]
        public double? width { get; set; }
        [BsonElement("height")]
        public double? height { get; set; }
        [BsonElement("price")]
        public double? price { get; set; } // Precio unitario del producto
        [BsonElement("Accesories")]
        public List<Budget_Accesory> Accesory { get; set; } = new List<Budget_Accesory>();
    }
}