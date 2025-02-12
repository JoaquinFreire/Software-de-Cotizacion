using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Entities;
using Interfaces;

namespace User
{
    internal class CreateUser
    {
        private readonly IUserRepository _userRepository;
        public CreateUser(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        public Entities.User Execute(string name, string lastname, UserRole role)
        {
            var user = new Entities.User(name, lastname, role);
            _userRepository.CreateUser(user);
            return user;
        }
    }
}
