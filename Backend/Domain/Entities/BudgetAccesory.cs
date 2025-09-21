using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
    public class BudgetAccesory //Clase auxiliar para representar un accesorio en el presupuesto
    {
        [BsonElement("name")]
        public required string Name { get; set; } // Nombre del accesorio
        [BsonElement("quantity")]
        public required int Quantity { get; set; } // Cantidad del accesorio
        [BsonElement("price")]
        public decimal? Price { get; set; }
    }
}
