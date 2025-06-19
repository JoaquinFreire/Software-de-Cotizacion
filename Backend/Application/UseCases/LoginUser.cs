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

    public async Task<(bool Success, string Error, User? User)> AuthenticateAsync(string legajo, string password)
    {
        var user = await _userRepository.GetByLegajoAsync(legajo);
        if (user == null)
        {
            return (false, "LEGAJO INCORRECTO", null);
        }

        if (user.status != 1)
        {
            return (false, "Credenciales correctas, pero aún está inactivo. Consulte al administrador.", null);
        }

        if (!BCrypt.Net.BCrypt.Verify(password, user.password_hash))
        {
            return (false, "CONTRASEÑA INCORRECTA", null);
        }

        return (true, "", user);
    }
}
