using Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Domain.Repositories
{
    public interface IOpeningTypeRepository
    {
        // Define los métodos que necesitas para interactuar con la colección Opening_Type
        Task<IEnumerable<Opening_Type>> GetAllAsync();
        Task<Opening_Type?> GetByIdAsync(int id);
        Task<Opening_Type?> GetByNameAsync(string name);
        Task AddAsync(Opening_Type openingType);
        Task UpdateAsync(Opening_Type openingType);
        Task DeleteAsync(int id);
    }
}
