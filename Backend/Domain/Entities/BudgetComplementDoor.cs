using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
    public class BudgetComplementDoor //Clase auxiliar para representar una puerta en el presupuesto
    {
        public string name { get; set; } // Nombre de la puerta
        public double width { get; set; } // Ancho de la puerta
        public double height { get; set; }
        public Coating coating { get; set; } // revestimiento de la puerta
        public int quantity { get; set; } // Cantidad de puertas
        public List<BudgetAccesory> accesories { get; set; } // Accesorios de la puerta
        public decimal price { get; set; } // Precio de la puerta
    }
}
