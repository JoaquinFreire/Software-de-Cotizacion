using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Repositories
{
    public interface IComplementPartition
    {
        Task<IEnumerable<Complement>> GetAllAsync();
        Task<Complement?> GetByIdAsync(int id);
        Task AddAsync(Complement complement);
        Task UpdateAsync(Complement complement);
        Task DeleteAsync(int id);
    }
}
