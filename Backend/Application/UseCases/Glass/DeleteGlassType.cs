using Domain.Repositories;

namespace Application.UseCases.Glass;

public class DeleteGlassType
{
    private readonly IGlassTypeRepository _repository;

    public DeleteGlassType(IGlassTypeRepository repository)
    {
        _repository = repository;
    }

    public async Task ExecuteAsync(int id)
    {
        await _repository.DeleteAsync(id);
    }
}
