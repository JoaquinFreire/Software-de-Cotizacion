using Application.DTOs;
using Domain.Repositories;

public class GetGlassTypeById
{
    private readonly IGlassTypeRepository _repository;

    public GetGlassTypeById(IGlassTypeRepository repository)
    {
        _repository = repository;
    }

    public async Task<GlassTypeDTO?> ExecuteAsync(int id)
    {
        var entity = await _repository.GetByIdAsync(id);
        if (entity == null) return null;

        return new GlassTypeDTO
        {
            id = entity.id,
            name = entity.name,
            price = entity.price ?? 0m
        };
    }
}
