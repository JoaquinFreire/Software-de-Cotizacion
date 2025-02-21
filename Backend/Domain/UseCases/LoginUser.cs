using Domain.Entities;
using Domain.Repositories;
using System.Threading.Tasks;
using BCrypt.Net;

public class LoginUser
{
    // Dependencia inyectada de la interfaz IUserRepository
    private readonly IUserRepository _userRepository;

    // Constructor que recibe una instancia de IUserRepository para realizar operaciones en la base de datos
    public LoginUser(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    // Método para autenticar un usuario con su legajo y contraseña
    public async Task<User?> AuthenticateAsync(string legajo, string password)
    {
        // Busca el usuario en el repositorio utilizando el legajo
        var user = await _userRepository.GetByLegajoAsync(legajo);

        // Si el usuario no existe o la contraseña es incorrecta, retorna null
        if (user == null || !BCrypt.Net.BCrypt.Verify(password, user.password_hash))
        {
            return null;
        }

        // Si la autenticación es correcta, retorna el usuario
        return user;
    }
}