using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
    public class Coating
    {
        public int id { get; set; } // Identificador del revestimiento
        public required string name { get; set; } // Nombre del revestimiento
        public decimal price { get; set; } // Precio del revestimiento
    }
}
