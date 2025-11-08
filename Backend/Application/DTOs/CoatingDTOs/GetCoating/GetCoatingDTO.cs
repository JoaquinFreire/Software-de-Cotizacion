using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.CoatingDTOs.GetCoating
{
    public class GetCoatingDTO
    {
        // nuevo: id expuesto
        public int id { get; set; }

        public required string name { get; set; }
        public required decimal price { get; set; }
        public required string description { get; set; }
    }
}
