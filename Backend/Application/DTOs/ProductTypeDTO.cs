using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs
{
    public class ProductTypeDTO
    {
        public string? Name { get; set; }
        public ProductCategoryDTO? Category { get; set; }
    }
}
