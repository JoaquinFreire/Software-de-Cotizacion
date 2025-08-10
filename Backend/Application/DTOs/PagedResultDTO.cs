using System.Collections.Generic;

namespace Application.DTOs
{
    public class PagedResultDTO<T>
    {
        public IEnumerable<T>? Items { get; set; }
        public int Total { get; set; }
    }
}
