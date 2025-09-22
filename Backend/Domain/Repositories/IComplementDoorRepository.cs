using Domain.Entities;

namespace Domain.Repositories
{
    public interface IComplementDoorRepository
    {
        Task<IEnumerable<ComplementDoor>> GetAllAsync();
        Task<ComplementDoor?> GetByIdAsync(int id);
        Task<ComplementDoor?> GetByNameAsync(string name);
        Task AddAsync(ComplementDoor door);
        Task UpdateAsync(ComplementDoor door);
        Task DeleteAsync(int id);
        Task<IEnumerable<ComplementDoor>> SearchByNameAsync(string text);
    }
}
