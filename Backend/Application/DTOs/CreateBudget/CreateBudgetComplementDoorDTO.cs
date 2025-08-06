using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.CreateBudget
{
    public class CreateBudgetComplementDoorDTO
    {
        public required string Name { get; set; }
        public required double Width { get; set; }
        public required double Height { get; set; }
        public CreateBudgetCoating? Coating { get; set; }
        public required int Quantity { get; set; }
        public List<CreateBudgetAccesoryDTO> Accesory { get; set; } = new List<CreateBudgetAccesoryDTO>();
        public required decimal Price { get; set; }
    }
}
