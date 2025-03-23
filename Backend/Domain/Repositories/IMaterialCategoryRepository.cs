using Domain.Entities;

namespace Domain.Repositories;

public interface IMaterialCategoryRepository
{
    Task<IEnumerable<MaterialCategory>> GetAllAsync();
}