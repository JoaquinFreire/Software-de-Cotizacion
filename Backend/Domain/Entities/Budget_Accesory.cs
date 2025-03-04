using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
    public class Budget_Accesory
    {
        [BsonElement("cantidad")]
        public int Quantity { get; set; }
        [BsonElement("nombre")]
        public string Name { get; set; }
        [BsonElement("tipo")]
        public MaterialType Type { get; set; }
    }
}
