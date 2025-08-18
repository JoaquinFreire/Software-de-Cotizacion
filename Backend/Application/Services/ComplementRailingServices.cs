using Domain.Repositories;
using Domain.Entities;
//TODO: Utilizar DTOs

namespace Application.Services
{
    public class ComplementRailingServices
    {
        private readonly IComplementRailingRepository _complementRailingRepository;
        public ComplementRailingServices(IComplementRailingRepository complementRailingRepository)
        {
            _complementRailingRepository = complementRailingRepository;
        }
        public async Task<IEnumerable<ComplementRailing>> GetAllAsync()
        {
            return await _complementRailingRepository.GetAllAsync();
        }
        public async Task<ComplementRailing> GetByIdAsync(int id)
        {
            return await _complementRailingRepository.GetByIdAsync(id);
        }
        public async Task AddAsync(ComplementRailing complementRailing)
        {
            await _complementRailingRepository.AddAsync(complementRailing);
        }
        public async Task UpdateAsync(ComplementRailing complementRailing)
        {
            await _complementRailingRepository.UpdateAsync(complementRailing);
        }
        public async Task DeleteAsync(int id)
        {
            await _complementRailingRepository.DeleteAsync(id);
        }
    }
}
