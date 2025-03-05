using Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Domain.Repositories
{
    public interface IWorkTypeRepository
    {
        Task<IEnumerable<WorkType>> GetAllAsync();
    }
}
