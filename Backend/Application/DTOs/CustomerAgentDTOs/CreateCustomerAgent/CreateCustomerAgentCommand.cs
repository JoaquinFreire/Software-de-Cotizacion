using MediatR;

namespace Application.DTOs.CustomerAgentDTOs.CreateCustomerAgent
{
    public class CreateCustomerAgentCommand : IRequest<Unit>
    {
        public required CreateCustomerAgentDTO AgentDTO { get; set; }
    }
}
