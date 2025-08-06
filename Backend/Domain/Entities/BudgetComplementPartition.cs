using Domain.Enums;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
    public class BudgetComplementPartition //Clase auxiliar para representar un tabique en el presupuesto
    {
        [BsonElement("name")]
        public string? Name { get; set; } // Nombre del complemento del tabique
        [BsonElement("height")]
        public double Height { get; set; } // Altura del tabique
        [BsonElement("quantity")]
        public int Quantity { get; set; } // Cantidad de tabiques
        [BsonElement("simple")]
        public bool Simple { get; set; } // Indica si el tabique es simple o doble
        [BsonElement("glassMilimeters")]
        public GlassMilimeters GlassMilimeters { get; set; } = GlassMilimeters.Mm6; // Espesor del vidrio
        [BsonElement("price")]
        public required decimal Price { get; set; } // Precio del complemento del tabique

    }
}
