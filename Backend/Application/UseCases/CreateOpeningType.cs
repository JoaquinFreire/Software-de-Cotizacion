using Application.DTOs;
using Domain.Entities;
using Domain.Repositories;

namespace Application.UseCases.OpeningType;

public class CreateOpeningType
{
    private readonly IOpeningTypeRepository _repository;

    public CreateOpeningType(IOpeningTypeRepository repository)
    {
        _repository = repository;
    }

    public async Task Execute(Opening_TypeDTO dto)
    {
        var entity = new Opening_Type
        {
            name = dto.name,
            weight = dto.weight,
            predefined_size = dto.predefined_size
        };

        await _repository.AddAsync(entity);
    }
}
