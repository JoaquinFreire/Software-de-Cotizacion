using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs
{
    public class WorkSpaceDTO
    {
        public string name { get; set; }
        public string address { get; set; }
        public WorkTypeDTO workType { get; set; }
    }
}
