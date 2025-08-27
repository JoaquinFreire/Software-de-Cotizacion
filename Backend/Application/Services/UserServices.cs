using Domain.Entities;
using Domain.Repositories;

namespace Application.Services
{
    public class UserServices
    {
        private readonly IUserRepository _userRepository;

        public UserServices(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }
        public async Task<User> GetUserData(int userId)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
                throw new KeyNotFoundException($"User with ID {userId} not found.");

            return new User
            {
                id = user.id,
                name = user.name,
                lastName = user.lastName,
                legajo = user.legajo,
                role = user.role,
                mail = user.mail
            };
        }

        public async Task<User?> GetByLegajoAsync(string legajo) { return await _userRepository.GetByLegajoAsync(legajo); }
        public async Task<User?> GetByIdAsync(int id) { return await _userRepository.GetByIdAsync(id); }
        public async Task<IEnumerable<User>> GetAllAsync() { return await _userRepository.GetAllAsync(); }
        public async Task AddAsync(User user) { await _userRepository.AddAsync(user); }
        public async Task UpdateAsync(User user) { await _userRepository.UpdateAsync(user); }
        public async Task DeleteAsync(int id) { await _userRepository.DeleteAsync(id); }
        public async Task<User?> GetByEmailAsync(string email) { return await _userRepository.GetByEmailAsync(email); }
        public async Task<User?> GetByDniAsync(string dni) { return await _userRepository.GetByDniAsync(dni); }
    }
}
