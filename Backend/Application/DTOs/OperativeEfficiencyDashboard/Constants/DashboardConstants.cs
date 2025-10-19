using Domain.Enums;

namespace Application.DTOs.OperativeEfficiencyDashboard.Constants
{
    public static class DashboardConstants
    {
        // Estados de cotización (basados en BudgetStatus enum)
        public static class Statuses
        {
            // Estados considerados como "activos" (en proceso)
            public static readonly BudgetStatus[] ActiveStatuses = {
                BudgetStatus.Pending,
                BudgetStatus.Approved,
            };

            // Estados considerados como "completados" (finalizados)
            public static readonly BudgetStatus[] CompletedStatuses = {
                BudgetStatus.Approved,
                BudgetStatus.Rejected,
                BudgetStatus.Finished
            };
        }

        // Umbrales para alertas
        public static class Thresholds
        {
            // Cotizaciones activas por usuario
            public const int ActiveQuotationsYellow = 10;
            public const int ActiveQuotationsRed = 15;

            // Días sin edición para considerar retraso
            public const int DaysWithoutEditYellow = 5;
            public const int DaysWithoutEditRed = 10;

            // Número de versiones
            public const int VersionCountYellow = 5;
            public const int VersionCountRed = 8;

            // Eficiencia (% de cotizaciones completadas)
            public const decimal EfficiencyYellow = 70.0m;
            public const decimal EfficiencyRed = 60.0m;

            // Retrasos por usuario
            public const int DelayedQuotationsYellow = 3;
            public const int DelayedQuotationsRed = 5;
        }

        // Rangos de tiempo
        public static class TimeRanges
        {
            public const string Last7Days = "7d";
            public const string Last30Days = "30d";
            public const string Last90Days = "90d";
        }

        // Colores para alertas
        public static class AlertColors
        {
            public const string Red = "red";
            public const string Yellow = "yellow";
            public const string Green = "green";
            public const string Gray = "gray"; // Para datos insuficientes
        }

        // Tendencias
        public static class Trends
        {
            public const string Up = "up";
            public const string Down = "down";
            public const string Stable = "stable";
        }
    }
}