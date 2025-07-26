using Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
    public class BudgetComplementPartition //Clase auxiliar para representar un tabique en el presupuesto
    {
        public string? name { get; set; } // Nombre del complemento del tabique
        public double height { get; set; } // Altura del tabique
        public int quantity { get; set; } // Cantidad de tabiques
        public bool simple { get; set; } // Indica si el tabique es simple o doble
        public GlassMilimeters GlassMilimeters { get; set; } = GlassMilimeters.Mm6; // Espesor del vidrio
        public required decimal price { get; set; } // Precio del complemento del tabique

    }
}
