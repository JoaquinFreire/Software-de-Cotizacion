using AutoMapper;
using Domain.Entities;
using Application.Services;
using MediatR;

namespace Application.DTOs.CustomerAgentDTOs.CreateCustomerAgent
{
    internal class CreateCustomerAgentHandler : IRequestHandler<CreateCustomerAgentCommand, Unit>
    {
        private readonly CustomerAgentServices _services;
        private readonly IMapper _mapper;
        public CreateCustomerAgentHandler(CustomerAgentServices services, IMapper mapper)
        {
            _services = services;
            _mapper = mapper;
        }
        public async Task<Unit> Handle(CreateCustomerAgentCommand request, CancellationToken cancellationToken)
        {
            var customerAgent = _mapper.Map<CustomerAgent>(request.AgentDTO);
            await _services.AddAsync(customerAgent);
            return Unit.Value;
        }
    }
}
