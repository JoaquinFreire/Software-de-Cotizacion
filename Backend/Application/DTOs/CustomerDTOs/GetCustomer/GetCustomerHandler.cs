using AutoMapper;
using MediatR;
using Domain.Repositories;

namespace Application.DTOs.CustomerDTOs.GetCustomer
{
    public class GetCustomerHandler : IRequestHandler<GetCustomerQuery, GetCustomerDTO>
    {
        private readonly IMapper _mapper;
        private readonly ICustomerRepository _customerRepository;
        public GetCustomerHandler(IMapper mapper, ICustomerRepository repository)
        {
            _mapper = mapper;
            _customerRepository = repository;
        }
        public async Task<GetCustomerDTO> Handle(GetCustomerQuery request, CancellationToken cancellationToken)
        {
            var customer = await _customerRepository.GetByDniAsync(request.CustomerDNI).ContinueWith(task =>
            {
                if (task.Result == null)
                {
                    throw new Exception($"No se encontró un cliente con el DNI: {request.CustomerDNI}");
                }
                return task.Result;
            });
            return _mapper.Map<GetCustomerDTO>(customer);
        }

    }

}
