using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.CoatingDTOs.CreateCoating
{
    public class CreateCoatingDTO
    {
        public required string name { get; set; }
        public required decimal price { get; set; }
        public required string description { get; set; }
    }
}
