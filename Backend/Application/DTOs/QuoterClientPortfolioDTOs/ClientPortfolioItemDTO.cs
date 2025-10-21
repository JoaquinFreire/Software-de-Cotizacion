using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.QuoterClientPortfolioDTOs
{
    public class ClientPortfolioItemDTO
    {
        public int ClientId { get; set; }
        public string ClientName { get; set; }
        public string ClientType { get; set; } // "Constructora", "Particular", "Distribuidor"
        public string Region { get; set; }
        public DateTime FirstContactDate { get; set; }
        public DateTime LastActivityDate { get; set; }
        public int DaysSinceLastActivity { get; set; }

        // MÉTRICAS DE RELACIÓN
        public int TotalQuotations { get; set; }
        public int AcceptedQuotations { get; set; }
        public decimal ConversionRate { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal AverageQuotationValue { get; set; }

        // CLASIFICACIÓN
        public string ValueTier { get; set; } // "A", "B", "C"
        public string ActivityStatus { get; set; } // "Activo", "Inactivo", "En Riesgo"
        public string Potential { get; set; } // "Alto", "Medio", "Bajo"

        // ACCIONES RECOMENDADAS
        public List<string> RecommendedActions { get; set; }
        public string NextFollowUp { get; set; } // "Urgente", "Esta semana", "Próximo mes"
    }
}
