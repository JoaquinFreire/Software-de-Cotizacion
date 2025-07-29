using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
    public class BudgetAccesory //Clase auxiliar para representar un accesorio en el presupuesto
    {
        public required string name { get; set; } // Nombre del accesorio
        public required int quantity { get; set; } // Cantidad del accesorio
        public required double price { get; set; }
    }
}
