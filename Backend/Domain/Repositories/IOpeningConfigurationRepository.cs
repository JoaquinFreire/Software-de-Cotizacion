using Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Domain.Repositories
{
    public interface IOpeningConfigurationRepository
    {
        Task<IEnumerable<Opening_Configuration>> GetAllAsync();
        
    }
}
