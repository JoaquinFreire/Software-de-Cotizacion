using Application.DTOs.OperativeEfficiencyDashboard.Dashboard;
using MediatR;

namespace Application.DTOs.OperativeEfficiencyDashboard.Alerts
{
    public class GetAlertsQuery: IRequest<List<AlertDTO>>
    {
        public string? Level { get; set; } // all, red, yellow
        public string TimeRange { get; set; } = "30d";
        public DashboardData DashboardData { get; set; }

    }
}
