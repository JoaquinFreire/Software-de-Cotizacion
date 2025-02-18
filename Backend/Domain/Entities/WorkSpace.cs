using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Entities
{
    public class WorkSpace
    {
        public int id { get; set; }
        public string name { get; set; }
        public string address { get; set; }
        public WorkType workType { get; set; }
    }
}
