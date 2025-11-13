using System;
using System.Linq;
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
            Console.WriteLine($"[CustomerServices] GetByIdAsync called with id={id}");
            // Intento llamar a un posible método especializado del repositorio que incluya Agents
            try
            {
                dynamic repo = _customerRepository;
                Console.WriteLine("[CustomerServices] Attempting repo.GetByIdWithAgentsAsync");
                var cust = await repo.GetByIdWithAgentsAsync(id);
                Console.WriteLine(cust == null
                    ? $"[CustomerServices] GetByIdWithAgentsAsync returned null for id={id}"
                    : $"[CustomerServices] GetByIdWithAgentsAsync returned customer id={cust.id}, agentsCount={(cust.Agents?.Count() ?? 0)}");
                return cust;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[CustomerServices] GetByIdWithAgentsAsync not available or failed: {ex.Message}. Falling back.");
                // Si no existe, usar el método clásico
                var cust = await _customerRepository.GetByIdAsync(id);
                Console.WriteLine(cust == null
                    ? $"[CustomerServices] Fallback GetByIdAsync returned null for id={id}"
                    : $"[CustomerServices] Fallback GetByIdAsync returned customer id={cust.id}, agentsCount={(cust.Agents?.Count() ?? 0)}");
                return cust;
            }
        }

        public async Task<Customer?> GetByDniAsync(string dni)
        {
            Console.WriteLine($"[CustomerServices] GetByDniAsync called with dni={dni}");
            // Intento llamar a un posible método especializado del repositorio que incluya Agents
            try
            {
                dynamic repo = _customerRepository;
                Console.WriteLine("[CustomerServices] Attempting repo.GetByDniWithAgentsAsync");
                var cust = await repo.GetByDniWithAgentsAsync(dni);
                Console.WriteLine(cust == null
                    ? $"[CustomerServices] GetByDniWithAgentsAsync returned null for dni={dni}"
                    : $"[CustomerServices] GetByDniWithAgentsAsync returned customer id={cust.id}, agentsCount={(cust.Agents?.Count() ?? 0)}");
                return cust;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[CustomerServices] GetByDniWithAgentsAsync not available or failed: {ex.Message}. Falling back.");
                // Si no existe, usar el método clásico
                var cust = await _customerRepository.GetByDniAsync(dni);
                Console.WriteLine(cust == null
                    ? $"[CustomerServices] Fallback GetByDniAsync returned null for dni={dni}"
                    : $"[CustomerServices] Fallback GetByDniAsync returned customer id={cust.id}, agentsCount={(cust.Agents?.Count() ?? 0)}");
                return cust;
            }
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
