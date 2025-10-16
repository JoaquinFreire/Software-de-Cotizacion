using Application.DTOs.OperativeEfficiencyDashboard.Dashboard;
using MediatR;

namespace Application.DTOs.OperativeEfficiencyDashboard.ProblematicQuotation
{
    public class GetProblematicQuotationQuery : IRequest<List<ProblematicQuotationDTO>>
    {
        public string TimeRange { get; set; } = "30d";
        public DashboardData DashboardData { get; set; }

    }
}
