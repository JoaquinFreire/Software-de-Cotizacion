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
        [BsonElement("Product")]
        public Opening_Type? OpeningType { get; set; }
        [BsonElement("AluminiumTreatment")]
        public AlumTreatment? AlumTreatment { get; set; }  //Tiene que almacenar el tratamiento de aluminio
        [BsonElement("glassType")]
        public GlassType? GlassType { get; set; }  //Tiene que almacenar el tipo de vidrio
        [BsonElement("width")]
        public double? width { get; set; }
        [BsonElement("height")]
        public double? height { get; set; }
        [BsonElement("quantity")]
        public int? Quantity { get; set; }
        [BsonElement("price")]
        public decimal? price { get; set; } // Precio unitario del producto
        [BsonElement("Accesories")]
        public List<BudgetAccesory> Accesory { get; set; } = new List<BudgetAccesory>();
    }
}