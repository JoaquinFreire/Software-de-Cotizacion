
namespace Application.DTOs.QuoterPersonalMetricsDTOs
{
    public class QuoterPersonalMetricsDTO
    {
        // RESUMEN EJECUTIVO
        public PerformanceSummaryDTO PerformanceSummary { get; set; }

        // MÉTRICAS CLAVE
        public KeyMetricsDTO KeyMetrics { get; set; }

        // TENDENCIAS TEMPORALES
        public List<MonthlyPerformanceDTO> MonthlyTrends { get; set; }

        // EFICIENCIA POR TIPO DE PRODUCTO
        public List<ProductEfficiencyDTO> ProductEfficiency { get; set; }

        // CLIENTES DESTACADOS
        public ClientHighlightsDTO ClientHighlights { get; set; }

        // ACCIONES INMEDIATAS
        public List<ActionItemDTO> ImmediateActions { get; set; }
    }
}
