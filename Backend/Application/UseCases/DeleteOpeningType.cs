using Domain.Repositories;

namespace Application.UseCases.OpeningType;

public class DeleteOpeningType
{
    private readonly IOpeningTypeRepository _repository;

    public DeleteOpeningType(IOpeningTypeRepository repository)
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
