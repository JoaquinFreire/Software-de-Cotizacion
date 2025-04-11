using Application.DTOs;
using Domain.Repositories;

public class GetAllGlassTypes
{
    private readonly IGlassTypeRepository _repository;

    public GetAllGlassTypes(IGlassTypeRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<GlassTypeDTO>> ExecuteAsync()
    {
        var entities = await _repository.GetAllAsync();
        return entities.Select(g => new GlassTypeDTO
        {
            id = g.id,
            name = g.name,
            price = g.price ?? 0m
        });
    }
}
