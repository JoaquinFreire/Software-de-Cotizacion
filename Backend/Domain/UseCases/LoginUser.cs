using Domain.Entities;
using Domain.Repositories;
using System.Threading.Tasks;
using BCrypt.Net;

public class LoginUser
{
    private readonly IUserRepository _userRepository;

    public LoginUser(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<User?> AuthenticateAsync(string legajo, string password)
    {
        var user = await _userRepository.GetByLegajoAsync(legajo);
        if (user == null || !BCrypt.Net.BCrypt.Verify(password, user.password_hash  ))
        {
            return null;
        }
        return user;
    }
}
