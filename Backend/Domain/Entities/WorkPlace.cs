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
        [BsonElement("address")]
        public string? address { get; set; }

        [Column("id_worktype")]
        [BsonIgnore]
        public int workTypeId { get; set; }

        [ForeignKey("workTypeId")]
        [BsonElement("workType")]
        public WorkType? workTypeAlt { get; set; } // Cambiado a workTypeAlt
    }
}
