using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.CreateBudget
{
    public class CreateBudgetComplementRailingDTO
    {
        public required string name { get; set; } // Nombre del complemento de baranda
        public required CreateBudgetAlumTreatmentDTO AlumTreatment { get; set; }
        public required bool Reinforced { get; set; } // Anodal ofrece refuerzos interiores para barandas
        public int Quantity { get; set; } // Cantidad de barandas
        public required decimal Price { get; set; } // Precio del complemento de baranda
    }
}
