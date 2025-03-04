using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Entities
{
    public class Customer
    {
        public int id { get; set; }
        public string name { get; set; } = string.Empty;
        public string lastname { get; set; } = string.Empty;
        public string tel { get; set; } = string.Empty;
        public string mail { get; set; } = string.Empty;
        public string address { get; set; } = string.Empty;

        [Column(TypeName = "datetime")]
        public DateTime registration_date { get; set; } = DateTime.UtcNow; // Inicializar con la fecha actual

        // Clave foránea para CustomerAgent
        [Column("id_agent")]
        public int? agentId { get; set; }
        public CustomerAgent? agent { get; set; }
    }
}

