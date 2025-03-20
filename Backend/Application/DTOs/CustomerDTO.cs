using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs
{
    public class CustomerDTO
    {
        public string? name { get; set; }
        public string? lastname { get; set; }
        public string? tel { get; set; }
        public string? mail { get; set; }
        public string? address { get; set; }
        public CustomerAgentDTO? agent { get; set; }

    }
}
