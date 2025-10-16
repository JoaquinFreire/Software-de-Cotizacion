using Application.DTOs.OperativeEfficiencyDashboard.Dashboard;
using MediatR;

namespace Application.DTOs.OperativeEfficiencyDashboard.DashboardKpis
{
    public class GetDashboardKpisQuery : IRequest<DashboardKpisDTO>
    {
        public string TimeRange { get; set; } = "30d"; // Rango de tiempo para las tendencias (e.g., "7d", "30d", "90d")
        public int? UserId { get; set; }
        public DashboardData DashboardData { get; set; }

    }
}
