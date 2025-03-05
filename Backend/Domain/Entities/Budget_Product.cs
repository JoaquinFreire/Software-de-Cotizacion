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
        [BsonElement("nombre_producto")]
        public string Name { get; set; }
        [BsonElement("tipo")]
        public ProductType Type { get; set; } // Tipo específico del producto
        [BsonElement("cantidad")]
        public int Quantity { get; set; }
        [BsonElement("tipo_aluminio")]
        public Material AlumMaterial { get; set; }  //Tiene que almacenar el tipo de aluminio
        [BsonElement("tipo_vidrio")]
        public Material GlassMaterial { get; set; }  //Tiene que almacenar el tipo de vidrio
        [BsonElement("ancho")]
        public double width { get; set; }
        [BsonElement("altura")]
        public double height { get; set; }
        [BsonElement("Accesorio")]
        public List<Budget_Accesory> Accesory { get; set; } = new List<Budget_Accesory>();
    }
}
