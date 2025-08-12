using MediatR;
using AutoMapper;
using Application.Services;

namespace Application.DTOs.CustomerDTOs.UpdateCustomer
{
    public class UpdateCustomerHandle : IRequestHandler<UpdateCustomerCommand, bool>
    {
        private readonly CustomerServices _customerServices;
        private readonly IMapper _mapper;
        public UpdateCustomerHandle(CustomerServices customerServices, IMapper mapper)
        {
            _customerServices = customerServices;
            _mapper = mapper;
        }
        public async Task<bool> Handle(UpdateCustomerCommand request, CancellationToken cancellationToken)
        {
            var customer = await _customerServices.GetByDniAsync(request.Dni);
            if (customer == null)
            {
                throw new Exception($"No se encontro un cliente con DNI: {request.Dni}");
            }
            _mapper.Map(request.UpdateCustomerDTO, customer);
            await _customerServices.UpdateAsync(customer);
            return true;
        }
    }
}
