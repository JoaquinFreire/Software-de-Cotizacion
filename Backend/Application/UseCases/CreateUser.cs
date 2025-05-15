using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Domain.Entities;
using Domain.Repositories;

namespace Application.UseCases;
public class CreateUser
{
    private readonly IUserRepository _userRepository;
    public CreateUser(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

}

