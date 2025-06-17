using Domain.Entities;
using System.Threading.Tasks;

namespace Domain.Repositories;

public interface IUserInvitationRepository
{
    Task<UserInvitation?> GetByTokenAsync(string token);
    Task AddAsync(UserInvitation invitation);
    Task MarkAsUsedAsync(int id);
}