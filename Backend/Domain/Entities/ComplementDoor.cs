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
        public required int id { get; set; }
        public required string name { get; set; }
        public required decimal price { get; set; }
        public required string Material { get; set; } // Material de la puerta
    }
}
