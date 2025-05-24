using Application.DTOs;
using Application.UseCases.Glass;
using Domain.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Controllers;

[ApiController]
[Authorize]
[Route("api/glass-types")]
public class GlassTypeController : ControllerBase
{
    private readonly IGlassTypeRepository _repository;

    public GlassTypeController(IGlassTypeRepository repository)
    {
        _repository = repository;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll() // aca lo que hace es llamar al
    {
        var useCase = new GetAllGlassTypes(_repository);
        var result = await useCase.ExecuteAsync();
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var useCase = new GetGlassTypeById(_repository);
        var result = await useCase.ExecuteAsync(id);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] GlassTypeDTO dto)
    {
        var useCase = new CreateGlassType(_repository);
        await useCase.ExecuteAsync(dto);
        return Ok();
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] GlassTypeDTO dto)
    {
        dto.id = id;
        var useCase = new UpdateGlassType(_repository);
        await useCase.ExecuteAsync(dto);
        return Ok();
    }
    /* Console.WriteLine($"ID: {id}");
    Console.WriteLine($"DTO ID: {dto.id}"); */
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var useCase = new DeleteGlassType(_repository);
        await useCase.ExecuteAsync(id);
        return Ok();
    }
}
