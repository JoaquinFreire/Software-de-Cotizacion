using MediatR;

namespace Application.DTOs.CustomerAgentDTOs.UpdateCustomerAgent
{
    public class UpdateCustomerAgentCommand : IRequest<Unit>
    {
        public required int id { get; set; }
        public required UpdateCustomerAgentDTO AgentDTO { get; set; }
    }
}
