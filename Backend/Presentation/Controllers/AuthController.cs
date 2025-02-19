using Microsoft.AspNetCore.Mvc;
using Domain.UseCases;
using System.Threading.Tasks;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly LoginUser _loginUser;

    public AuthController(LoginUser loginUser)
    {
        _loginUser = loginUser;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _loginUser.AuthenticateAsync(request.Legajo, request.Password);
        if (user == null) return Unauthorized(new { message = "Credenciales inválidas" });

        return Ok(new { message = "Login exitoso", userId = user.id }); //ver
    }
}

public class LoginRequest
{
    public string Legajo { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
