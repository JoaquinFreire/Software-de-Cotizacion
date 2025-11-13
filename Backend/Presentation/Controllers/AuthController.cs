using Application.DTOs.UserDTOs.GetUser;
using Application.Services;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Linq;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly LoginUser _loginUser;
    private readonly UserServices _services;
    private readonly IMediator _mediator;

    public AuthController(LoginUser loginUser, UserServices services, IMediator mediator)
    {
        _loginUser = loginUser;
        _services = services;
        _mediator = mediator;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var (success, error, user) = await _loginUser.AuthenticateAsync(request.Legajo, request.Password);
        if (!success) return Unauthorized(new { error }); // Devuelve un error 401

        if (user == null) return Unauthorized(new { error = "User not found" });
        var token = GenerateJwtToken(user);

        // Devolver también los datos esenciales del usuario para que el frontend tenga name/lastName/legajo/mail/role
        return Ok(new {
            message = "Login exitoso",
            user = new {
                id = user.id,
                name = user.name,
                lastName = user.lastName,
                legajo = user.legajo,
                mail = user.mail,
                role = user.role
            },
            token
        });
    }

    private string GenerateJwtToken(Domain.Entities.User user)
    {
        string jwtKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY") ?? throw new Exception("JWT_SECRET_KEY no está definida.");
        string jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? "default-issuer";
        string jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? "default-audience";

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // Intentar derivar first/last name a partir de user (si user tiene name completo)
        var fullName = user.name ?? "";
        var parts = fullName.Trim().Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
        var firstName = parts.Length > 0 ? parts[0] : "";
        var lastName = parts.Length > 1 ? string.Join(" ", parts.Skip(1)) : "";

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.id.ToString()), // Se asigna el ID del usuario
            new Claim(ClaimTypes.Name, user.name ?? firstName), // Nombre completo o firstName
            new Claim(ClaimTypes.Role, user.role?.role_name ?? "user"),
            // Añadir claims separados para given name y surname para que el frontend pueda leerlos directamente
            new Claim(ClaimTypes.GivenName, firstName ?? ""),
            new Claim(ClaimTypes.Surname, lastName ?? "")
        };

        var token = new JwtSecurityToken(
            jwtIssuer,
            jwtAudience,
            claims,
            expires: System.DateTime.UtcNow.AddHours(2),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetUserData()
    {
        var userId = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var query = new GetUserQuery { id = int.Parse(userId) };
        var userDto = await _mediator.Send(query);

        // Dividir el nombre completo en firstName y lastName para el frontend,
        // pero preferir el lastName explícito si viene en el DTO
        var fullName = userDto.name ?? "";
        var parts = fullName.Trim().Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
        var derivedFirstName = parts.Length > 0 ? parts[0] : "";
        var derivedLastName = parts.Length > 1 ? string.Join(" ", parts.Skip(1)) : "";

        return Ok(new
        {
            user = new
            {
                id = userDto.id,
                name = userDto.name,
                firstName = derivedFirstName,
                // preferir lastName del DTO si existe, sino usar la derivación
                lastName = string.IsNullOrWhiteSpace(userDto.lastName) ? derivedLastName : userDto.lastName,
                mail = userDto.mail,
                role = userDto.role,
                // incluir legajo para que el frontend pueda mostrarlo
                legajo = userDto.legajo
                // incluir otras propiedades que necesites
            },
            userId = userDto.id
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
