using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Entities
{
    [Table("worktype")]  // Asegúrate de que la tabla se llame "worktype"
    public class WorkType
    {
        public int id { get; set; }
        public string type { get; set; }
    }
}
