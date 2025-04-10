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
        public string? name { get; set; }
        [BsonIgnore]
        public double? weight { get; set; }
        [BsonIgnore]
        public double? predefined_size { get; set; }
    }
}