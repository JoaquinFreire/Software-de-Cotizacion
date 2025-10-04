using MediatR;

namespace Application.DTOs.TimeLineBudgetReportDTOs.TimeLine
{
    public class TimelineQuery : IRequest<List<BudgetTimeLineDTO>>
    {
        public string CustomerDni { get; set; } = string.Empty;
        public string? BudgetIdFilter { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }

        // Nuevos filtros
        public decimal? MontoMin { get; set; }
        public decimal? MontoMax { get; set; }
        public string? Ubicacion { get; set; }
        public string? UsuarioGenerador { get; set; }
        public string? AgenteDni { get; set; }
        public string? TipoProducto { get; set; }
        public string? OrdenMonto { get; set; } = "desc"; // "asc" o "desc"
        public string? OrdenFecha { get; set; } = "desc"; // "asc" o "desc"
    }
}