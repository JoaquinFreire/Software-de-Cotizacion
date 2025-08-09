using Domain.Entities;
using Domain.Repositories;

namespace Application.Services
{
    public class CustomerServices
    {
        private readonly ICustomerRepository _customerRepository;

        public CustomerServices(ICustomerRepository customerRepository)
        {
            _customerRepository = customerRepository;
        }

        public async Task<IEnumerable<Customer>> GetAllAsync()
        {
            return await _customerRepository.GetAllAsync();
        }
        public async Task<Customer?> GetByIdAsync(int id)
        {
            return await _customerRepository.GetByIdAsync(id);
        }

        public async Task<Customer?> GetByDniAsync(string dni)
        {
            return await _customerRepository.GetByDniAsync(dni);
        }

        public async Task AddAsync(Customer customer)
        {
            await _customerRepository.AddAsync(customer);
        }

        public async Task UpdateAsync(Customer customer)
        {
            await _customerRepository.UpdateAsync(customer);
        }
        public async Task DeleteAsync(int id)
        {
            await _customerRepository.DeleteAsync(id);
        }

        public async Task<(IEnumerable<Customer> Items, int Total)> GetPagedAsync(int page, int pageSize)
        {
            return await _customerRepository.GetPagedAsync(page, pageSize);
        }
    }
}
