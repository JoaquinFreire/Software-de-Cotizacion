using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
    public class Opening_Type
    {
        [BsonIgnore]
        public int id { get; set; }
        [BsonElement("name")]
        public string? Name { get; set; }
        [BsonIgnore]
        public double? Weight { get; set; }
        [BsonIgnore]
        public double? Predefined_Size { get; set; }
    }
}