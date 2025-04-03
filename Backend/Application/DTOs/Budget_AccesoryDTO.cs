using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs
{
    public class Budget_AccesoryDTO
    {
        public ComplementDTO? Accesory { get; set; }
        public int? Quantity { get; set; }
    }
}
