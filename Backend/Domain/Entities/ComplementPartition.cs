using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
    public class ComplementPartition //Tabique
    {
        [BsonIgnore]
        public required int Id { get; set; }
        public required string name { get; set; }
        public decimal price { get; set; }
    }
}
