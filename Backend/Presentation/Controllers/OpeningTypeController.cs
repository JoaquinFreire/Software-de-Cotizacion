using Application.DTOs;
using Application.UseCases.OpeningType;
using Domain.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Controllers;

[Route("api/opening-types")]
[ApiController]
[Authorize]
public class OpeningTypeController : ControllerBase
{
    private readonly IOpeningTypeRepository _repository;

    public OpeningTypeController(IOpeningTypeRepository repository)
    {
        _repository = repository;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var useCase = new GetAllOpeningTypes(_repository);
        var result = await useCase.Execute();
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var useCase = new GetOpeningTypeById(_repository);
        var result = await useCase.Execute(id);
        return result is not null ? Ok(result) : NotFound();
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Opening_TypeDTO dto)
    {
        var useCase = new CreateOpeningType(_repository);
        await useCase.Execute(dto);
        return CreatedAtAction(nameof(GetAll), null);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Opening_TypeDTO dto)
    {
        var useCase = new UpdateOpeningType(_repository);
        var success = await useCase.Execute(id, dto);
        return success ? NoContent() : NotFound();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var useCase = new DeleteOpeningType(_repository);
        var success = await useCase.Execute(id);
        return success ? NoContent() : NotFound();
    }
}
