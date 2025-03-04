using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace Domain.Entities
{
    public class CustomerAgent
    {
        public int id { get; set; }
        public string name { get; set; } = string.Empty;
        public string tel { get; set; } = string.Empty;
        public string mail { get; set; } = string.Empty;
        [Required]
        public string lastname { get; set; } = string.Empty;
    }
}

