using Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Domain.Repositories
{
    public interface IWorkPlaceRepository
    {
        Task<IEnumerable<WorkPlace>> GetAllAsync();
        Task<WorkPlace?> GetByIdAsync(int id);
        Task AddAsync(WorkPlace workPlace);
        Task UpdateAsync(WorkPlace workPlace);
        Task DeleteAsync(int id);
    }
}

