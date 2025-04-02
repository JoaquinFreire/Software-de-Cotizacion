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
        [BsonElement("accesory")]
        public Complement? Accesory { get; set; }
        [BsonElement("cantidad")]
        public int? Quantity { get; set; }
    }
}