using Domain.Entities;

namespace Application.DTOs.OperativeEfficiencyDashboard.Dashboard
{
    public class DashboardData
    {
        public List<Budget> AllBudgets { get; set; } = new List<Budget>();
        public List<User> AllUsers { get; set; } = new List<User>();
        public List<Quotation> AllQuotations { get; set; } = new List<Quotation>();
    }
}
