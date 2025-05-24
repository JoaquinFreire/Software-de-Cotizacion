using Application.DTOs;
using Domain.Entities;
using Domain.Repositories;

namespace Application.UseCases.Price
{
    public class CreatePrice
    {
        private readonly IPriceRepository _repository;

        public CreatePrice(IPriceRepository repository)
        {
            _repository = repository;
        }

        public async Task Execute(PriceDTO dto)
        {
            var entity = new Domain.Entities.Price
            {
                name = dto.name,
                price = dto.price
            };

            await _repository.AddAsync(entity);
        }
    }
}
