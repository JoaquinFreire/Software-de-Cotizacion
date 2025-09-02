
namespace Application.DTOs.CustomerAgentDTOs.CreateCustomerAgent
{
    public class CreateCustomerAgentDTO
    {
        public required string name { get; set; }
        public required string lastname { get; set; }
        public required string dni { get; set; }
        public required string tel { get; set; }
        public required string mail { get; set; }
    }
}
