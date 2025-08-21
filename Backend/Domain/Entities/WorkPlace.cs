using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
    public class WorkPlace
    {
        [BsonIgnore]
        public int id { get; set; }
        [BsonElement("name")]
        public string? name { get; set; }
        [BsonElement("location")]
        public string? location { get; set; }
        [BsonElement("address")]
        public string? address { get; set; }
        // Clave foránea para WorkType
        [BsonIgnore]
        [Column("id_worktype")]
        public int workTypeId { get; set; }
        [BsonElement("workType")]
        public WorkType? WorkType { get; set; } 
    }
}
