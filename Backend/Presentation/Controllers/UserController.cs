using Domain.Entities;
using MediatR;
using Application.Services;
using Application.DTOs.UserDTOs.CreateUser;
using Domain.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using BCrypt.Net;
using Microsoft.EntityFrameworkCore; // Para AppDbContext

[ApiController]
[Route("api/users")]
[Authorize]
public class UserController : ControllerBase
{
    private readonly IUserRepository _userRepository;
    private readonly IMediator _mediator; // aca joaquin
    private readonly UserServices _userServices;

    public UserController(IUserRepository userRepository, IMediator mediator, UserServices userServices)
    {
        _userRepository = userRepository;
        _mediator = mediator;
        _userServices = userServices;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var users = await _userRepository.GetAllAsync();
        return Ok(users);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null) return NotFound();
        return Ok(user);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserDTO newUser)
    {
        if (string.IsNullOrEmpty(newUser.password_hash))
        {
            newUser.password_hash = BCrypt.Net.BCrypt.HashPassword("1234");
        }
        var command = new CreateuserCommand { User = newUser };
        await _mediator.Send(command);

        return Ok(new { message = "Usuario creado exitosamente." });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] User updatedUser)
    {
        if (updatedUser == null || updatedUser.id != id)
            return BadRequest("Invalid data.");

        var existingUser = await _userRepository.GetByIdAsync(id);
        if (existingUser == null) return NotFound();

        // Evita que EF intente actualizar la relación de rol
        updatedUser.role = null;

        await _userRepository.UpdateAsync(updatedUser);
        return NoContent();
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> ToggleStatus(int id, [FromBody] ToggleStatusRequest request)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null) return NotFound();

        user.status = request.Status;
        await _userRepository.UpdateAsync(user);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null) return NotFound();

        await _userRepository.DeleteAsync(id);
        return NoContent();
    }

    [HttpGet("/api/userroles")]
    public async Task<IActionResult> GetRoles([FromServices] AppDbContext context)
    {
        var roles = await context.Set<UserRole>().ToListAsync();
        return Ok(roles);
    }
}

public class ToggleStatusRequest
{
    public int Status { get; set; }
}
