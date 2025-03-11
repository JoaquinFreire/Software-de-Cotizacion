using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace Domain.Entities
{
    public class CustomerAgent
    {
        [BsonIgnore][JsonIgnore]
        public int id { get; set; }
        [BsonElement("name")]
        public string name { get; set; }
        [BsonElement("lastName")]
        [Required]
        public string lastname { get; set; }
        [BsonElement("telephoneNumber")]
        public string tel { get; set; }
        [BsonElement("email")]
        public string mail { get; set; }
    }
}

