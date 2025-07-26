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
        public int id { get; set; }
        public string? name { get; set; }
        public decimal price { get; set; }
        public string? Material { get; set; } // Material de la puerta
    }
}
