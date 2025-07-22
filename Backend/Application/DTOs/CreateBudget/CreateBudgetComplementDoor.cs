using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.CreateBudget
{
    public class CreateBudgetComplementDoor
    {
        public required string name { get; set; }
        public required double width { get; set; }
        public required double height { get; set; }
        public required string? Material { get; set; }
        public required int Quantity { get; set; }
        //Propiedad de Revestimientos(podria ser utilizando AlumTreatments)
        public List<CreateBudgetAccesoryDTO> Accesory { get; set; } = new List<CreateBudgetAccesoryDTO>();
        public required decimal Price { get; set; }
    }
}
