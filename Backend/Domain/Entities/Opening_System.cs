using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
    public class Opening_System
    {
        [BsonIgnore]
        public int Id { get; set; }
        [BsonElement("nombre")]
        public string Name { get; set; }

    }
}
