using Domain.Entities;

namespace Domain.Repositories
{
    public interface IBudgetAccesoryRepository
    {
        public Task<Accesory> AddAccesoryAsync(Accesory accesory);
        public Task<Accesory> UpdateAccesoryAsync(Accesory accesory);
        public Task DeleteAccesoryAsync(int id);
        public Task<List<Accesory>> GetAllAccesoriesAsync();
        public Task<Accesory?> GetAccesoryByIdAsync(int id);

    }
}
