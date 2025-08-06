using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.GetBudget
{
    public class GetBudgetByIdComplementRailingDTO
    {
        public string Name { get; set; } // Nombre del complemento
        public GetBudgetByIdAlumTreatmentDTO AlumTreatment { get; set; } // Tratamiento del aluminio
        public bool Reinforced { get; set; } // Con refuerzos interiores para barandas, o no
        public int Quantity { get; set; } // Cantidad del complemento
        public decimal Price { get; set; } // Precio del complemento

    }
}
