using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
    public class BudgetComplementRailing //Clase auxiliar para representar una baranda en el presupuesto
    {
        [BsonElement("name")]
        public required string Name { get; set; } // Nombre del complemento de baranda
        [BsonElement("AluminiumTreatmen")]
        public required AlumTreatment AlumTreatment { get; set; } // Tratamiento de aluminio
        [BsonElement("reinforced")]
        public required bool Reinforced { get; set; } // Anodal ofrece refuerzos interiores para barandas
        [BsonElement("quantity")]
        public int Quantity { get; set; } // Cantidad de barandas
        [BsonElement("price")]
        public required decimal Price { get; set; } // Precio del complemento de baranda
    }
}
