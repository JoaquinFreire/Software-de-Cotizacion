using Domain.Repositories;

namespace Application.Services
{
    public class WorkTypeServices
    {
        private readonly IWorkTypeRepository _workTypeRepository;
        public WorkTypeServices(IWorkTypeRepository workTypeRepository)
        {
            _workTypeRepository = workTypeRepository;
        }
        public async Task<IEnumerable<Domain.Entities.WorkType>> GetAllAsync()
        {
            return await _workTypeRepository.GetAllAsync();
        }
    }
}
