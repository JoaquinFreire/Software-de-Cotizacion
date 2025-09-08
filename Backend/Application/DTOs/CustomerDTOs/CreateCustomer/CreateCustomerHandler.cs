using AutoMapper;
using MediatR;
using Domain.Repositories;
using Domain.Entities;
using Application.Validators.CustomerValidation;

namespace Application.DTOs.CustomerDTOs.CreateCustomer
{
    public class CreateCustomerHandler : IRequestHandler<CreateCustomerCommand, string>
    {
        private readonly IMapper _mapper;
        private readonly ICustomerRepository _repository;
        private readonly ICustomerValidator _validator;
        public CreateCustomerHandler(IMapper mapper, ICustomerRepository repository, ICustomerValidator validator)
        {
            _mapper = mapper;
            _repository = repository;
            _validator = validator;
        }
        public async Task<string> Handle(CreateCustomerCommand request, CancellationToken cancellationToken)
        {
            var customer = _mapper.Map<Customer>(request.createCustomerDTO);
            await _validator.Validate(customer); // Validar el cliente
            customer.registration_date = DateTime.UtcNow; // Inicializar con la fecha actual
            await _repository.AddAsync(customer);
            return customer.id.ToString(); //Devuelve el id del cliente creado
        }
    }
}
