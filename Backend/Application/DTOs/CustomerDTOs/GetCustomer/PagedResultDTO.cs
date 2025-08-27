using System.Collections.Generic;

namespace Application.DTOs.CustomerDTOs.GetCustomer
{
    public class PagedResultDTO<T>
    {
        public IEnumerable<T>? Items { get; set; }
        public int Total { get; set; }
    }
}
