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
        public int id { get; set; }
        [BsonElement("treatment")]
        public required string name { get; set; }
        [BsonElement("price")]
        public string? pricePercentage { get; set; }
    }
}
