
namespace Application.DTOs.CustomerAgentDTOs.GetCustomerAgent
{
    public class GetCustomerAgentDTO
    {
        public int id { get; set; }
        public required string name { get; set; }
        public required string lastname { get; set; }
        public required string dni { get; set; }
        public required string tel { get; set; }
        public required string mail { get; set; }
        public DateTime registration_date { get; set; } = DateTime.Now;
    }
}
