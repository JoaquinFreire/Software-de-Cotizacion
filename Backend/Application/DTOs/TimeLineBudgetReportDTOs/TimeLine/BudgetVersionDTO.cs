using Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.TimeLineBudgetReportDTOs.TimeLine
{
    public class BudgetVersionDTO
    {
        public string Id { get; set; } = string.Empty;
        public string BudgetId { get; set; } = string.Empty;
        public int Version { get; set; }
        public DateTime CreationDate { get; set; }
        public BudgetStatus Status { get; set; }
        public decimal Total { get; set; }
        public string Comment { get; set; } = string.Empty;
    }
}
