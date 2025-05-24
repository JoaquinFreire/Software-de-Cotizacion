using Domain.Entities;
using Domain.Repositories;

namespace Application.UseCases.Price
{
    public class GetAllPrices
    {
        private readonly IPriceRepository _repository;

        public GetAllPrices(IPriceRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<Domain.Entities.Price>> Execute()
        {
            return await _repository.GetAllAsync();
        }
    }
}
