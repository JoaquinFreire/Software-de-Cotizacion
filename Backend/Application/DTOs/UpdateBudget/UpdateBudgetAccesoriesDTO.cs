using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.UpdateBudget
{
    public class UpdateBudgetAccesoriesDTO
    {
        //En caso de no crear la tabla de accesorios, se puede eliminar esta clase y usar directamente Complement
        public string name { get; set; }
        public string price { get; set; }
        public string quantity { get; set; }
    }
}
