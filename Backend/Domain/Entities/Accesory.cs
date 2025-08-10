using Domain.Enums;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
    public class Accesory
    {
        [BsonIgnore]
        public required int id { get; set; }
        public required string name { get; set; }
        [BsonIgnore]
        public required MaterialUnit unit { get; set; }
    }
}