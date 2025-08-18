using Domain.Repositories;
using Domain.Entities;

namespace Application.Services
{
    public class OpeningTypeServices
    {
        private readonly IOpeningTypeRepository _repository;
        public OpeningTypeServices(IOpeningTypeRepository repository)
        {
            _repository = repository;
        }
        public async Task<IEnumerable<Opening_Type>> GetAllAsync() { return await _repository.GetAllAsync(); }
        public async Task<Opening_Type?> GetByIdAsync(int id) { return await _repository.GetByIdAsync(id); }
        public async Task AddAsync(Opening_Type openingType) { await _repository.AddAsync(openingType);}
        public async Task UpdateAsync(Opening_Type openingType) { await _repository.UpdateAsync(openingType); }
        public async Task DeleteAsync(int id) { await _repository.DeleteAsync(id); }
    }
}
