using Domain.Repositories;

namespace Application.UseCases.AlumTreatment
{
    public class DeleteAlumTreatment
    {
        private readonly IAlumTreatmentRepository _repository;

        public DeleteAlumTreatment(IAlumTreatmentRepository repository)
        {
            _repository = repository;
        }

        public async Task ExecuteAsync(int id)
        {
            await _repository.DeleteAsync(id);
        }
    }
}
