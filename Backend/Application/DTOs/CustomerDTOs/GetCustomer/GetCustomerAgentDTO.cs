using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.CustomerDTOs.GetCustomer
{
    public class GetCustomerAgentDTO
    {
        public required string name { get; set; }
        public required string lastname { get; set; }
        public required string dni { get; set; }
        public required string tel { get; set; }
        public required string mail { get; set; }
    }
}
