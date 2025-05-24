using Domain.Entities;
using Domain.Repositories;

namespace Application.UseCases.OpeningType;

public class GetAllOpeningTypes
{
    private readonly IOpeningTypeRepository _repository;

    public GetAllOpeningTypes(IOpeningTypeRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<Opening_Type>> Execute()
    {
        return await _repository.GetAllAsync();
    }
}
