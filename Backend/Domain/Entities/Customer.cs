using MongoDB.Bson.Serialization.Attributes;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities;

    public class Customer
    {
        [BsonIgnore]
        public int id { get; set; }
        [BsonElement("name")]
        public string name { get; set; }
        [BsonElement("lastname")]
        public string lastname { get; set; }
        [BsonElement("telephoneNumber")]
        public string telephoneNumber { get; set; }
        [BsonElement("email")]
        public string email { get; set; }
        [BsonElement("address")]
        public string address { get; set; }
        public string registration_date { get; set; }
        [BsonElement("agent")]
        public CustomerAgent agent { get; set; }
    }

