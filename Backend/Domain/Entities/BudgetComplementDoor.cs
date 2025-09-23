using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
    public class BudgetComplementDoor //Clase auxiliar para representar una puerta en el presupuesto
    {
        [BsonElement("name")]
        public required string Name { get; set; } // Nombre de la puerta
        [BsonElement("width")]
        public required double Width { get; set; } // Ancho de la puerta
        [BsonElement("height")]
        public required double Height { get; set; }
        [BsonElement("Coating")]
        public required Coating Coating { get; set; } // revestimiento de la puerta
        [BsonElement("quantity")]
        public required int Quantity { get; set; } // Cantidad de puertas
        [BsonElement("Accesory")]
        public List<BudgetAccesory>? Accesory { get; set; } // Accesorios de la puerta
        [BsonElement("price")]
        public required decimal Price { get; set; } // Precio de la puerta
    }
}
