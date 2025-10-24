namespace Application.DTOs.SustainabilityReportDTOs
{
    public class SustainabilityMetricsDTO
    {
        // KPIs Principales
        public decimal TotalRevenue { get; set; }
        public decimal GrowthRate { get; set; }
        public decimal AverageTicket { get; set; }
        public decimal ProbableRevenue { get; set; }

        // Datos para gráficos
        public List<MonthlyRevenueDTO> MonthlyTrends { get; set; } = new();
        public List<ProductRevenueDTO> ProductMix { get; set; } = new();
        public List<ClientConcentrationDTO> ClientConcentration { get; set; } = new();

        // Ingresos probables
        public RevenueForecastDTO RevenueForecast { get; set; } = new();

        // Métricas de salud
        public BusinessHealthDTO BusinessHealth { get; set; } = new();
    }

    public class MonthlyRevenueDTO
    {
        public string Month { get; set; } = string.Empty;
        public decimal Revenue { get; set; }
        public decimal PreviousYearRevenue { get; set; }
        public decimal GrowthRate { get; set; }
    }

    public class ProductRevenueDTO
    {
        public string ProductName { get; set; } = string.Empty;
        public decimal Revenue { get; set; }
        public decimal Percentage { get; set; }
    }

    public class ClientConcentrationDTO
    {
        public string ClientName { get; set; } = string.Empty;
        public decimal Revenue { get; set; }
        public decimal Percentage { get; set; }
        public string RiskLevel { get; set; } = string.Empty; // "LOW", "MEDIUM", "HIGH"
    }

    public class RevenueForecastDTO
    {
        public List<PendingQuotationDTO> HighProbability { get; set; } = new();
        public List<PendingQuotationDTO> MediumProbability { get; set; } = new();
        public decimal TotalHighProbabilityRevenue => HighProbability.Sum(x => x.TotalAmount);
        public decimal TotalMediumProbabilityRevenue => MediumProbability.Sum(x => x.TotalAmount);
        public decimal TotalPendingRevenue => TotalHighProbabilityRevenue + TotalMediumProbabilityRevenue;
    }

    public class PendingQuotationDTO
    {
        public string ClientName { get; set; } = string.Empty;
        public string WorkPlaceName { get; set; } = string.Empty;
        public string WorkPlaceLocation { get; set; } = string.Empty;
        public string AgentName { get; set; } = string.Empty;
        public string QuotatorName { get; set; } = string.Empty;
        public DateTime CreationDate { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal ConversionRate { get; set; }
        public string ProbabilityLevel { get; set; } = string.Empty; // "HIGH", "MEDIUM"
        public int VersionCount { get; set; }
        public decimal InitialAmount { get; set; } // Para calcular ajustes de precio
    }

    public class BusinessHealthDTO
    {
        public decimal DiversificationScore { get; set; } // 0-100
        public decimal RecurrenceRate { get; set; } // % clientes recurrentes
        public string SeasonalityLevel { get; set; } = string.Empty; // "LOW", "MEDIUM", "HIGH"
        public List<string> Strengths { get; set; } = new();
        public List<string> Alerts { get; set; } = new();
        public List<string> Recommendations { get; set; } = new();
    }
}