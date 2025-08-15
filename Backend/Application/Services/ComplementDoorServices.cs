
using Domain.Entities;
using Domain.Repositories;

namespace Application.Services
{
    public class ComplementDoorServices
    {
        private readonly IComplementDoorRepository _complementDoorRepository;
        public ComplementDoorServices(IComplementDoorRepository complementDoorRepository)
        {
            _complementDoorRepository = complementDoorRepository;
        }
        public async Task<IEnumerable<ComplementDoor>> GetAllAsync() { return await _complementDoorRepository.GetAllAsync();}
        public async Task<ComplementDoor?> GetByIdAsync(int id) { return await _complementDoorRepository.GetByIdAsync(id); }
        public async Task AddAsync(ComplementDoor door) { await _complementDoorRepository.AddAsync(door); }
        public async Task UpdateAsync(ComplementDoor door) { await _complementDoorRepository.UpdateAsync(door); }
        public async Task DeleteAsync(int id) { await _complementDoorRepository.DeleteAsync(id); }
    }
}
