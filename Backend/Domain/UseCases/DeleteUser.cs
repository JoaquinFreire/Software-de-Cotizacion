using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Entities;
using Interfaces;

namespace User
{
    internal class DeleteUser
    {
        private readonly IUserRepository _userRepository;
        public DeleteUser(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

    }
}
