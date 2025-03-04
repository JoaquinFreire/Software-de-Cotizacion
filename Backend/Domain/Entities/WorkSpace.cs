using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
    public class WorkSpace
    {
        [BsonIgnore]
        public int id { get; set; }
        [BsonElement("name")]
        public string name { get; set; }
        [BsonElement("address")]
        public string address { get; set; }
        [BsonElement("workType")]
        public WorkType workType { get; set; }
    }
}
