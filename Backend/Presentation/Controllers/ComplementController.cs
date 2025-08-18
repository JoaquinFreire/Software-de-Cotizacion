using Domain.Entities;
using Domain.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Controllers;

[ApiController]
[Route("api/complements")]
[Authorize]
public class ComplementController : ControllerBase
    //TODO: Eliminar??
{
    private readonly IComplementRepository _repository;
    private readonly IComplementRepository _complementRepository;
    public ComplementController(IComplementRepository repository, IComplementRepository complementRepository)
    {
        _repository = repository;
        _complementRepository = complementRepository;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var complements = await _repository.GetAllAsync();
        return Ok(complements);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var complement = await _repository.GetByIdAsync(id);
        if (complement == null) return NotFound();
        return Ok(complement);
    }
    //// PUT: api/complements/{id}
    //[HttpPut("{id}")]
    //public async Task<IActionResult> Update(int id, [FromBody] Complement complement)
    //{
    //    if (complement == null || id != complement.id)
    //    {
    //        return BadRequest("Invalid data.");
    //    }

    //    var existingComplement = await _complementRepository.GetByIdAsync(id);
    //    if (existingComplement == null)
    //    {
    //        return NotFound();
    //    }

    //    await _complementRepository.UpdateAsync(complement);
    //    return NoContent();
    //}

    // DELETE: api/materials/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var material = await _complementRepository.GetByIdAsync(id);
        if (material == null)
        {
            return NotFound();
        }

        await _complementRepository.DeleteAsync(id);
        return NoContent();
    }
}
