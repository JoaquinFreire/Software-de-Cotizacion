using Domain.Entities;
using Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs
{
    public class MaterialDTO
    {
        public string? name { get; set; }
        public MaterialTypeDTO? type { get; set; }
        public double? price { get; set; }
    }
}
