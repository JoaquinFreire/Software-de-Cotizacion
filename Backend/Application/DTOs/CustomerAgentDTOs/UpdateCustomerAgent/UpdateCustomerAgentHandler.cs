using MediatR;
using AutoMapper;
using Domain.Entities;
using Application.Services;

namespace Application.DTOs.CustomerAgentDTOs.UpdateCustomerAgent
{
    public class UpdateCustomerAgentHandler : IRequestHandler<UpdateCustomerAgentCommand, Unit>
    {
        private readonly CustomerAgentServices _services;
        private readonly IMapper _mapper;
        public UpdateCustomerAgentHandler(CustomerAgentServices services, IMapper mapper)
        {
            _services = services;
            _mapper = mapper;
        }
        public async Task<Unit> Handle(UpdateCustomerAgentCommand request, CancellationToken cancellationToken)
        {
            var existingAgent = await _services.GetByIdAsync(request.id);
            if (existingAgent == null)
            {
                throw new KeyNotFoundException($"Customer agent with ID {request.id} not found.");
            }
            _mapper.Map(request.AgentDTO, existingAgent);
            await _services.UpdateAsync(existingAgent);
            return Unit.Value;
        }
    }
}
