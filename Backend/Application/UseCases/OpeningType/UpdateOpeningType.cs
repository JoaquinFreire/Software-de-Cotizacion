using Application.DTOs;
using Domain.Repositories;

namespace Application.UseCases.OpeningType;

public class UpdateOpeningType
{
    private readonly IOpeningTypeRepository _repository;

    public UpdateOpeningType(IOpeningTypeRepository repository)
    {
        _repository = repository;
    }

    public async Task<bool> Execute(int id, Opening_TypeDTO dto)
    {
        var existing = await _repository.GetByIdAsync(id);
        if (existing is null) return false;

        existing.name = dto.name;
        existing.weight = dto.weight;
        existing.predefined_size = dto.predefined_size;

        await _repository.UpdateAsync(existing);
        return true;
    }
}
