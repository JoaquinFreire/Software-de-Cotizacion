using Domain.Repositories;
using Domain.Entities;
using AutoMapper;
using Application.DTOs.CustomerAgentDTOs.GetCustomerAgent;

namespace Application.Services
{
    public class CustomerAgentServices
    {
        private readonly ICustomerAgentRepository _customerAgentRepository;
        private readonly IMapper _mapper;
        public CustomerAgentServices(ICustomerAgentRepository customerAgentRepository, IMapper mapper)
        {
            _customerAgentRepository = customerAgentRepository;
            _mapper = mapper;
        }
        public async Task<List<GetCustomerAgentDTO>> GetAllAsync() 
        { 
            var agents = await _customerAgentRepository.GetAllAsync(); 
            return _mapper.Map<List<GetCustomerAgentDTO>>(agents);
        }
        public async Task<CustomerAgent?> GetByIdAsync(int id) { return await _customerAgentRepository.GetByIdAsync(id); }
        public async Task AddAsync(CustomerAgent agent) {await _customerAgentRepository.AddAsync(agent); }
        public async Task UpdateAsync(CustomerAgent agent) { await _customerAgentRepository.UpdateAsync(agent); }
        public async Task DeleteAsync(int id) { await _customerAgentRepository.DeleteAsync(id); }
    }
}
