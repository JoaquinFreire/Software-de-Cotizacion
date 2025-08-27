using Domain.Repositories;
using Domain.Entities;

namespace Application.Services
{
    public class UserInvitationServices
    {
        private readonly IUserInvitationRepository _repository;
        public UserInvitationServices(IUserInvitationRepository repository)
        {
            _repository = repository;
        }
        public async Task<UserInvitation?> GetByTokenAsync(string token)
        {
            return await _repository.GetByTokenAsync(token);
        }
        public async Task AddAsync(UserInvitation invitation)
        {
            await _repository.AddAsync(invitation);
        }
        public async Task MarkAsUsedAsync(int id)
        {
            await _repository.MarkAsUsedAsync(id);
        }
    }
}
