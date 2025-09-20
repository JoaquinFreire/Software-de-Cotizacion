using Domain.Entities;
using Domain.Repositories;


namespace Application.Services;

public class AccessoryServices
{
    private readonly IAccesoryRepository _accessoryRepository;
    public AccessoryServices(IAccesoryRepository accessoryRepository)
    {
        _accessoryRepository = accessoryRepository;
    }
    public async Task<IEnumerable<Accesory>> GetAllAsync()
    {
        return await _accessoryRepository.GetAllAsync();
    }
    public async Task<Accesory?> GetByIdAsync(int id)
    {
        return await _accessoryRepository.GetByIdAsync(id) ?? throw new KeyNotFoundException($"Accessory with id {id} not found.");
    }
    public async Task AddAsync(Accesory accesory)
    {
        await _accessoryRepository.AddAsync(accesory);
    }
    public async Task UpdateAsync(Accesory accesory){
        await _accessoryRepository.UpdateAsync(accesory);
    }
    public async Task DeleteAsync(int id)
    {
        await _accessoryRepository.DeleteAsync(id);
    }

}
