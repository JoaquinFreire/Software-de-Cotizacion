using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Domain.Entities;
using Domain.Repositories;
using Application.DTOs;

namespace Application.Services
{
    public class UserServices
    {
        private readonly IUserRepository _userRepository;

        public UserServices(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }
        public async Task<UserDTO> GetUserData(int userId)
        {
            
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
                throw new KeyNotFoundException($"User with ID {userId} not found.");

            return new UserDTO
            {
                id = user.id,
                name = user.name,
                lastName = user.lastName,
                legajo = user.legajo,
                role = user.role.role_name,
                mail = user.mail
            };
        }

        public async Task<User?> GetByLegajoAsync(string legajo)
        {
            if (string.IsNullOrEmpty(legajo))
                throw new ArgumentException("Legajo cannot be null or empty.", nameof(legajo));

            return await _userRepository.GetByLegajoAsync(legajo);
        }
        public async Task<User?> GetByIdAsync(int id)
        {
            if (id <= 0)
                throw new ArgumentException("ID must be greater than zero.", nameof(id));

            return await _userRepository.GetByIdAsync(id);
        }
        public async Task<IEnumerable<User>> GetAllAsync()
        {
            return await _userRepository.GetAllAsync();
        }
        public async Task AddAsync(User user)
        {
            if (user == null)
                throw new ArgumentNullException(nameof(user), "User cannot be null.");

            if (string.IsNullOrEmpty(user.name) || string.IsNullOrEmpty(user.lastName) || user.role_id <= 0)
                throw new ArgumentException("User must have a valid name, last name, and role ID.", nameof(user));

            // If password_hash is not provided, hash a default password
            if (string.IsNullOrEmpty(user.password_hash))
            {
                throw new ArgumentException("La contraseña no debe ser vacía", nameof(user));
            }

            await _userRepository.AddAsync(user);
        }
        public async Task UpdateAsync(User user)
        {
            if (user == null)
                throw new ArgumentNullException(nameof(user), "User cannot be null.");

            if (user.id <= 0)
                throw new ArgumentException("User ID must be greater than zero.", nameof(user.id));

            var existingUser = await _userRepository.GetByIdAsync(user.id);
            if (existingUser == null)
                throw new KeyNotFoundException($"User with ID {user.id} not found.");

            // Update properties as needed
            existingUser.name = user.name;
            existingUser.lastName = user.lastName;
            existingUser.legajo = user.legajo;
            existingUser.password_hash = user.password_hash;
            existingUser.role_id = user.role_id;
            existingUser.mail = user.mail;

            await _userRepository.UpdateAsync(existingUser);
        }
        public async Task DeleteAsync(int id)
        {
            if (id <= 0)
                throw new ArgumentException("ID must be greater than zero.", nameof(id));

            var user = await _userRepository.GetByIdAsync(id);
            if (user == null)
                throw new KeyNotFoundException($"User with ID {id} not found.");

            await _userRepository.DeleteAsync(id);
        }
        public async Task<User?> GetByEmailAsync(string email)
        {
            if (string.IsNullOrEmpty(email))
                throw new ArgumentException("Email cannot be null or empty.", nameof(email));

            return await _userRepository.GetByEmailAsync(email);
        }
        public async Task<User?> GetByDniAsync(string dni)
        {
            if (string.IsNullOrEmpty(dni))
                throw new ArgumentException("DNI cannot be null or empty.", nameof(dni));

            return await _userRepository.GetByDniAsync(dni);
        }
    }
}
