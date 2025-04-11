using Application.DTOs;
using Domain.Entities;
using Domain.Repositories;

namespace Application.UseCases;

public class UpdateGlassType
{
    private readonly IGlassTypeRepository _repository;

    public UpdateGlassType(IGlassTypeRepository repository)
    {
        _repository = repository;
    }

    public async Task ExecuteAsync(GlassTypeDTO dto)
    {
        var entity = new GlassType
        {
            id = dto.id,
            name = dto.name,
            price = dto.price
        };
        await _repository.UpdateAsync(entity);
    }
}