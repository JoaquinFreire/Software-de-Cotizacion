using Application.DTOs;
using Domain.Repositories;

namespace Application.UseCases.Price
{
    public class UpdatePrice
    {
        private readonly IPriceRepository _repository;

        public UpdatePrice(IPriceRepository repository)
        {
            _repository = repository;
        }

        public async Task<bool> Execute(int id, PriceDTO dto)
        {
            var existing = await _repository.GetByIdAsync(id);
            if (existing is null) return false;

            existing.name = dto.name;
            existing.price = dto.price;

            await _repository.UpdateAsync(existing);
            return true;
        }
    }
}
