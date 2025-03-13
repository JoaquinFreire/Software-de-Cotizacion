using Microsoft.AspNetCore.Mvc;
using Domain.UseCases;
using System.Threading.Tasks;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Domain.Repositories;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly LoginUser _loginUser;
    private readonly IUserRepository _userRepository;
    private readonly IConfiguration _configuration;

    public AuthController(LoginUser loginUser, IUserRepository userRepository, IConfiguration configuration)
    {
        _loginUser = loginUser;
        _userRepository = userRepository;
        _configuration = configuration;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var (success, error, user) = await _loginUser.AuthenticateAsync(request.Legajo, request.Password);
        if (!success) return Unauthorized(new { error });

        var token = GenerateJwtToken(user);
        return Ok(new { message = "Login exitoso", userId = user.id, token });
    }

    private string GenerateJwtToken(Domain.Entities.User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.id.ToString()),
            new Claim(ClaimTypes.Name, user.name),
            new Claim(ClaimTypes.Role, user.role.role_name)
        };

        var token = new JwtSecurityToken(
            _configuration["Jwt:Issuer"],
            _configuration["Jwt:Audience"],
            claims,
            expires: System.DateTime.UtcNow.AddHours(5),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    [HttpGet("me")]
    [Authorize] // Solo permite acceso si el usuario está autenticado
    public async Task<IActionResult> GetUserData()  // 🔹 Ahora es un método async
    {
        var userId = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var user = await _userRepository.GetByIdAsync(int.Parse(userId)); // 🔹 Ahora se puede usar await

        if (user == null) return NotFound();

        return Ok(new { userId = user.id, name = user.name, role = user.role.role_name });
    }
}

public class LoginRequest
{
    public string Legajo { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
