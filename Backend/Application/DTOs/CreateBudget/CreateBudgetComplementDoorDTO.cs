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
        public required string name { get; set; }
        public required double width { get; set; }
        public required double height { get; set; }
        public CreateBudgetCoating? coating { get; set; }
        public required int quantity { get; set; }
        public List<CreateBudgetAccesoryDTO> accesories { get; set; } = new List<CreateBudgetAccesoryDTO>();
        public required decimal price { get; set; }
    }
}
