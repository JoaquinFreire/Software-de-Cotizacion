using Domain.Entities;
using Domain.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Controllers
{
    [ApiController]
    [Route("api/coating")]
    public class CoatingController : ControllerBase
    {
        private readonly ICoatingRepository _repository;

        public CoatingController(ICoatingRepository repository)
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
        public async Task<IActionResult> Create([FromBody] Coating coating)
        {
            await _repository.AddAsync(coating);
            return CreatedAtAction(nameof(GetById), new { id = coating.id }, coating);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Coating coating)
        {
            if (id != coating.id) return BadRequest();
            await _repository.UpdateAsync(coating);
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
