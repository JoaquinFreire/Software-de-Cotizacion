using Domain.Repositories;
using Domain.Entities;

namespace Application.Services
{
    public class PriceServices
    {
        private readonly IPriceRepository _priceRepository;
        public PriceServices(IPriceRepository priceRepository)
        {
            _priceRepository = priceRepository;
        }
        public async Task<IEnumerable<Price>> GetAllAsync() { return await _priceRepository.GetAllAsync(); }
        public async Task<Price?> GetByIdAsync(int id) { return await _priceRepository.GetByIdAsync(id); }
        public async Task AddAsync(Price price) { await _priceRepository.AddAsync(price); }
        public async Task UpdateAsync(Price price) { await _priceRepository.UpdateAsync(price); }
        public async Task DeleteAsync(int id) { await _priceRepository.DeleteAsync(id); }
    }
}
