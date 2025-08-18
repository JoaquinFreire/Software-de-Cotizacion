using Domain.Entities;
using Domain.Repositories;

namespace Application.Services
{
    public class GlassTypeServices
    {
        private readonly IGlassTypeRepository _glassTypeRepository;
        public GlassTypeServices(IGlassTypeRepository glassTypeRepository)
        {
            _glassTypeRepository = glassTypeRepository;
        }
        public async Task<IEnumerable<GlassType>> GetAllAsync() { return await _glassTypeRepository.GetAllAsync(); }
        public async Task<GlassType?> GetByIdAsync(int id) { return await _glassTypeRepository.GetByIdAsync(id); }
        public async Task AddAsync(GlassType glassType) { await _glassTypeRepository.AddAsync(glassType); }
        public async Task UpdateAsync(GlassType glassType) { await _glassTypeRepository.UpdateAsync(glassType); }
        public async Task DeleteAsync(int id) { await _glassTypeRepository.DeleteAsync(id); }
    }
}
