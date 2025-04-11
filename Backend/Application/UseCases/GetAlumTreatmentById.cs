using Domain.Entities;
using Domain.Repositories;

namespace Application.UseCases.AlumTreatment;

public class GetAlumTreatmentById
{
    private readonly IAlumTreatmentRepository _repository;

    public GetAlumTreatmentById(IAlumTreatmentRepository repository)
    {
        _repository = repository;
    }

    public async Task<Domain.Entities.AlumTreatment?> ExecuteAsync(int id)
    {
        return await _repository.GetByIdAsync(id);
    }
}
