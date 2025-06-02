using Application.DTOs;
using Domain.Entities;
using Domain.Repositories;

public class CreateGlassType
{
    private readonly IGlassTypeRepository _repository;

    public CreateGlassType(IGlassTypeRepository repository)
    {
        _repository = repository;
    }

    public async Task ExecuteAsync(GlassTypeDTO dto)
    {
        var entity = new GlassType
        {
            name = dto.name,
            price = dto.price
        };

        await _repository.AddAsync(entity);
    }
}
