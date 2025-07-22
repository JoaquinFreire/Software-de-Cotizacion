using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
    public class ComplementDoor // Puerta
    {
        [BsonIgnore]
        public int id { get; set; }
        public string? name { get; set; }
        public double price { get; set; }
        public double width { get; set; } // Ancho de la puerta
        public double height { get; set; } // Alto de la puerta
        public string? Material { get; set; } // Material de la puerta
        public List<Accesory> Accesory { get; set; } = new List<Accesory>();
    }
}
