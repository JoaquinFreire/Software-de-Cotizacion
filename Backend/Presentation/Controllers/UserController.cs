using Domain.Entities;
using MediatR;
using Application.Services;
using Application.DTOs.UserDTOs.CreateUser;
using Application.DTOs.UserDTOs.UpdateUser;
using Application.DTOs.UserDTOs.UpdateUserStatus;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;// Para AppDbContext

//TODO: Eliminar referencia  a la capa de dominio
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
    public async Task<IActionResult> GetAll()
    {
        var users = await _services.GetAllAsync();
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
    public async Task<IActionResult> Create([FromBody] CreateUserDTO newUser)
    {
        await _mediator.Send(new CreateUserCommand { user = newUser });
        return Ok(new { message = "Usuario creado exitosamente." });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUserDTO updatedUser)
    {
        var command = await _mediator.Send(new UpdateUserCommand{ Id = id, userDTO = updatedUser });
        return NoContent();
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> ToggleStatus(int id)
    {
        var command = await _mediator.Send(new UpdateUserStatusCommand{ Id = id});
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _services.DeleteAsync(id);
        return NoContent();
    }

    //TODO: Crear un servicio para manejar los roles de usuario
    [HttpGet("/api/userroles")]
    public async Task<IActionResult> GetRoles([FromServices] AppDbContext context)
    {
        var roles = await context.Set<UserRole>().ToListAsync();
        return Ok(roles);
    }
}

