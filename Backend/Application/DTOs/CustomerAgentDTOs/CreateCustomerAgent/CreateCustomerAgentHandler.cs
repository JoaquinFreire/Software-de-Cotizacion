using AutoMapper;
using Domain.Entities;
using Application.Services;
using MediatR;
using Application.Validators.CustomerAgentValidation;

namespace Application.DTOs.CustomerAgentDTOs.CreateCustomerAgent
{
    internal class CreateCustomerAgentHandler : IRequestHandler<CreateCustomerAgentCommand, Unit>
    {
        private readonly CustomerAgentServices _services;
        private readonly IMapper _mapper;
        private readonly ICustomerAgentValidator _validation;
        public CreateCustomerAgentHandler(CustomerAgentServices services, IMapper mapper, ICustomerAgentValidator validation)
        {
            _services = services;
            _mapper = mapper;
            _validation = validation;
        }
        public async Task<Unit> Handle(CreateCustomerAgentCommand request, CancellationToken cancellationToken)
        {
            var customerAgent = _mapper.Map<CustomerAgent>(request.AgentDTO);
            await _validation.Validate(customerAgent);
            await _services.AddAsync(customerAgent);
            return Unit.Value;
        }
    }
}
