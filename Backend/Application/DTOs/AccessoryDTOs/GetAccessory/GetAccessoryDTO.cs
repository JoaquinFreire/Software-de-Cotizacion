using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Application.DTOs.AccessoryDTOs.GetAccessory
{
    public class GetAccessoryDTO
    {
        public required int id { get; set; }
        public required string name { get; set; }   
        public required decimal price { get; set; }
    }
}