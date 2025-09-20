using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Application.DTOs.AccessoryDTOs.CreateAccessory
{
    public class CreateAccessoryDTO
    {
        public required int id { get; set; }
        public required string name { get; set; }
        public required decimal price { get; set; }
    }
}