using Domain.Entities;
using Domain.Repositories;

namespace Application.UseCases.OpeningType;

public class GetOpeningTypeById
{
    private readonly IOpeningTypeRepository _repository;

    public GetOpeningTypeById(IOpeningTypeRepository repository)
    {
        _repository = repository;
    }

    public async Task<Opening_Type?> Execute(int id)
    {
        return await _repository.GetByIdAsync(id);
    }
}
