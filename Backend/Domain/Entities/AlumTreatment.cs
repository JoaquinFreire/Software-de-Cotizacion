using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
    public class AlumTreatment
    {
        [BsonIgnore]
        public int Id { get; set; }
        [BsonElement("treatment")]
        public string? Name { get; set; }
        [BsonElement("price")]
        public double Price { get; set; }
    }
}
