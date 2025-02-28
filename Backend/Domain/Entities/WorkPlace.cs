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
        public int id { get; set; }
        public string? name { get; set; }
        public string? address { get; set; }
        // Clave foránea para WorkType

        [Column("id_worktype")]
        public int workTypeId { get; set; }
        public WorkType? WorkType { get; set; } 
    }
}
