using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Application.Services;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly LoginUser _loginUser;
    private readonly UserServices _services;

    public AuthController(LoginUser loginUser, UserServices services)
    {
        _loginUser = loginUser;
        _services = services;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var (success, error, user) = await _loginUser.AuthenticateAsync(request.Legajo, request.Password);
        if (!success) return Unauthorized(new { error }); // Devuelve un error 401

        if (user == null) return Unauthorized(new { error = "User not found" });
        var token = GenerateJwtToken(user);
        return Ok(new { message = "Login exitoso", userIdw = user.id, token });
    }

    private string GenerateJwtToken(Domain.Entities.User user)
    {
        string jwtKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY") ?? throw new Exception("JWT_SECRET_KEY no está definida.");
        string jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? "default-issuer";
        string jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? "default-audience";
    
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.id.ToString()), // Se asigna el ID del usuario
            new Claim(ClaimTypes.Name, user.name), // Se asigna el nombre del usuario
            new Claim(ClaimTypes.Role, user.role.role_name ?? "user") // Si el rol no está definido, se asigna "user"
        };

        var token = new JwtSecurityToken(
            jwtIssuer,
            jwtAudience,
            claims,
            expires: System.DateTime.UtcNow.AddHours(2), // El token expira en 30 minutos
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    [HttpGet("me")]
    [Authorize] // Solo permite acceso si el usuario está autenticado
    public async Task<IActionResult> GetUserData()
    {
        var userId = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();
        var user = await _services.GetUserData(int.Parse(userId));
        if (user == null) return NotFound();

        return Ok(new
        {
            user,
            userId = user.id,
 /*            mail = user.mail, // Nueva propiedad
            status = user.status // Nueva propiedad */
        });
    }

    [HttpPost("extend-session")]
    [Authorize]
    public async Task<IActionResult> ExtendSession()
    {
        var userId = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var user = await _services.GetByIdAsync(int.Parse(userId));
        if (user == null) return NotFound();

        var token = GenerateJwtToken(user);
        return Ok(new { token });
    }
}

public class LoginRequest
{
    public string Legajo { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
