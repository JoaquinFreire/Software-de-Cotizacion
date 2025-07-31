using Domain.Entities;
using Domain.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Controllers
{
    [ApiController]
    [Route("api/railing")]
    public class ComplementRailingController : ControllerBase
    {
        private readonly IComplementRailingRepository _repository;

        public ComplementRailingController(IComplementRailingRepository repository)
        {
            _repository = repository;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var items = await _repository.GetAllAsync();
            return Ok(items);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var item = await _repository.GetByIdAsync(id);
            if (item == null) return NotFound();
            return Ok(item);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ComplementRailing railing)
        {
            await _repository.AddAsync(railing);
            return CreatedAtAction(nameof(GetById), new { id = railing.id }, railing);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] ComplementRailing railing)
        {
            if (id != railing.id) return BadRequest();
            await _repository.UpdateAsync(railing);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _repository.DeleteAsync(id);
            return NoContent();
        }
    }
}
