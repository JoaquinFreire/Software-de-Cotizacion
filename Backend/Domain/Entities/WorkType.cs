using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
    public class WorkType
    {
        [BsonIgnore]
        public int id { get; set; }
        [BsonElement("type")]
        public string type { get; set; }
    }
}
