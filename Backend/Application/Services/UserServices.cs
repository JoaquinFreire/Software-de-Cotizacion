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
            if (user == null) return null;

            return new UserDTO
            {
                id=user.id,
                name = user.name,
                legajo = user.Legajo,
                role = user.role.role_name
            };
        }
    }
}
