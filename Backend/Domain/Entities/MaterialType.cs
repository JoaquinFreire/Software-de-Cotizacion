using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Entities
{
    public class MaterialType
    {
        public int id { get; set; }
        public string? name { get; set; }
        public int category_id { get; set; }
        public MaterialCategory? category { get; set; } // Relación
    }
}
