using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.CustomerDTOs.UpdateCustomer
{
    public class UpdateCustomerDTO
    {
        public required string tel { get; set; }
        public required string mail { get; set; }
        public required string address { get; set; }
    }
}
