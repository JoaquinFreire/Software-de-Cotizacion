using Application.DTOs;
using Domain.Repositories;
using Domain.Entities;

namespace Application.UseCases.AlumTreatment;
public class CreateAlumTreatment
{
    private readonly IAlumTreatmentRepository _repository;

    public CreateAlumTreatment(IAlumTreatmentRepository repository)
    {
        _repository = repository;
    }

    public async Task ExecuteAsync(AlumTreatmentDTO dto)
    {
        var entity = new Domain.Entities.AlumTreatment
        {
            id = dto.id,
            name = dto.name,
            pricePercentage = dto.pricePercentage
        };

        await _repository.AddAsync(entity);
    }
}