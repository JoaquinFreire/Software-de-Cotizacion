using MediatR;

namespace Application.DTOs.OperativeEfficiencyDashboard.Workload
{
    public class GetWorkloadQuery : IRequest<List<WorkloadDTO>>
    {
        public string TimeRange { get; set; } = "30d"; // Rango de tiempo para las tendencias (e.g., "7d", "30d", "90d")
    }
}
