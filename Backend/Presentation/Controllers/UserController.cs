using Domain.Entities;
using MediatR;
using Application.Services;
using Application.DTOs.UserDTOs.CreateUser;
using Application.DTOs.UserDTOs.UpdateUser;
using Application.DTOs.UserDTOs.UpdateUserStatus;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;// Para AppDbContext
using System.Security.Claims;
using System.Text.RegularExpressions;

[ApiController]
[Route("api/users")]
[Authorize]
public class UserController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly UserServices _services;

    public UserController(IMediator mediator, UserServices services)
    {
        _mediator = mediator;
        _services = services;
    }

    [HttpGet]
    [Authorize(Roles = "coordinator,manager")]
    public async Task<IActionResult> GetAll()
    {
        var users = await _services.GetAllAsync();
        return Ok(users);
    }
    [HttpGet("active")]
    [Authorize(Roles = "coordinator,manager")]
    public async Task<IActionResult> GetAllActive()
    {
        var users = await _services.GetAllActiveAsync();
        return Ok(users);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var user = await _services.GetByIdAsync(id);
        if (user == null) return NotFound();
        return Ok(user);
    }

    [HttpPost]
    [Authorize(Roles = "coordinator,manager")]
    public async Task<IActionResult> Create([FromBody] CreateUserDTO newUser)
    {
        await _mediator.Send(new CreateUserCommand { user = newUser });
        return Ok(new { message = "Usuario creado exitosamente." });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "coordinator,manager")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUserDTO updatedUser)
    {
        var command = await _mediator.Send(new UpdateUserCommand { Id = id, userDTO = updatedUser });
        return NoContent();
    }

    // Permite que el usuario actual actualice su propio perfil (solo campos permitidos: mail)
    [HttpPut("me")]
    public async Task<IActionResult> UpdateMe([FromBody] UpdateMeDTO dto, [FromServices] AppDbContext context)
    {
        // Obtener user id desde el token
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                      ?? User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
        if (!int.TryParse(idClaim, out var userId))
            return Forbid();

        var user = await context.Users.FindAsync(userId);
        if (user == null) return NotFound();

        // Validación mínima del email (si se envía)
        if (dto?.mail != null)
        {
            var email = dto.mail.Trim();
            if (!Regex.IsMatch(email, @"^[^\s@]+@[^\s@]+\.[^\s@]+$"))
            {
                // Devolver estructura compatible con ProblemDetails.errors para mostrar en frontend
                return BadRequest(new
                {
                    type = "https://tools.ietf.org/html/rfc9110#section-15.5.1",
                    title = "One or more validation errors occurred.",
                    status = 400,
                    errors = new { mail = new[] { "El email tiene un formato inválido." } }
                });
            }
            user.mail = email;
        }
        else
        {
            return BadRequest(new { message = "No hay campos para actualizar." });
        }

        await context.SaveChangesAsync();
        return NoContent();
    }

    // DTO del endpoint UpdateMe — debe ser público para que la firma del método público sea consistente
    public class UpdateMeDTO
    {
        public string? mail { get; set; }
    }

    [HttpPut("{id}/status")]
    [Authorize(Roles = "coordinator,manager")]
    public async Task<IActionResult> ToggleStatus(int id)
    {
        var command = await _mediator.Send(new UpdateUserStatusCommand { Id = id });
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "coordinator,manager")]
    public async Task<IActionResult> Delete(int id)
    {
        await _services.DeleteAsync(id);
        return NoContent();
    }

    //TODO: Crear un servicio para manejar los roles de usuario
    [HttpGet("userroles")]
    [Authorize(Roles = "coordinator,manager")]
    public async Task<IActionResult> GetRoles([FromServices] AppDbContext context)
    {
        var roles = await context.Set<UserRole>().ToListAsync();
        return Ok(roles);
    }
}

