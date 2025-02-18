using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Domain.Entities;
using Domain.Repositories;

namespace Domain.UseCases;
public class DeleteUser
{
    private readonly IUserRepository _userRepository;
    public DeleteUser(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

}

