using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
    public class ComplementRailing //Baranda
    {
        [BsonIgnore]
        public int id { get; set; }
        public string? name { get; set; }
        public decimal price { get; set; }
    }
}
