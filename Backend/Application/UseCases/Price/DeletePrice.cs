using Domain.Repositories;

namespace Application.UseCases.Price
{
    public class DeletePrice
    {
        private readonly IPriceRepository _repository;

        public DeletePrice(IPriceRepository repository)
        {
            _repository = repository;
        }

        public async Task<bool> Execute(int id)
        {
            var existing = await _repository.GetByIdAsync(id);
            if (existing is null) return false;

            await _repository.DeleteAsync(id);
            return true;
        }
    }
}
