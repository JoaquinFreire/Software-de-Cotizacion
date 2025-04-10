using Domain.Entities;
using Domain.Repositories;

namespace Application.UseCases.Price
{
    public class GetPriceById
    {
        private readonly IPriceRepository _repository;

        public GetPriceById(IPriceRepository repository)
        {
            _repository = repository;
        }

        public async Task<Domain.Entities.Price?> Execute(int id)
        {
            return await _repository.GetByIdAsync(id);
        }
    }
}
