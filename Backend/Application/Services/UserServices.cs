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
                throw new ArgumentException($"User with ID {userId} not found.");

            return new UserDTO
            {
                id = user.id,
                name = user.name,
                lastName = user.lastName,
                legajo = user.legajo,
                role = user.role.role_name,
                mail = user.mail, // Nueva propiedad
                status = user.status // Nueva propiedad
            };
        }
    }
}
