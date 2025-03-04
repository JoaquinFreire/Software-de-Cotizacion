using System.Collections.Generic;
using System.Threading.Tasks;
using Domain.Entities;

namespace Domain.Repositories
{
    public interface ICustomerAgentRepository
    {
        Task<IEnumerable<CustomerAgent>> GetAllAsync();
        Task<CustomerAgent?> GetByIdAsync(int id);
        Task AddAsync(CustomerAgent agent);
        Task UpdateAsync(CustomerAgent agent);
        Task DeleteAsync(int id);
    }
}

