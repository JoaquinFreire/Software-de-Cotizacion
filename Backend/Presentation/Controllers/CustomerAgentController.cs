using Domain.Entities;
using Domain.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;

[ApiController]
[Route("api/customer-agents")]
[Authorize]
public class CustomerAgentController : ControllerBase
{
    private readonly ICustomerAgentRepository _customerAgentRepository;

    public CustomerAgentController(ICustomerAgentRepository customerAgentRepository)
    {
        _customerAgentRepository = customerAgentRepository;
    }

    [HttpGet]
    public async Task<IEnumerable<CustomerAgent>> GetAll()
    {
        return await _customerAgentRepository.GetAllAsync();
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var agent = await _customerAgentRepository.GetByIdAsync(id);
        if (agent == null) return NotFound();
        return Ok(agent);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CustomerAgent newAgent)
    {
        if (newAgent == null || string.IsNullOrEmpty(newAgent.lastname)) return BadRequest("Invalid data.");

        await _customerAgentRepository.AddAsync(newAgent);
        return CreatedAtAction(nameof(GetById), new { id = newAgent.id }, newAgent);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] CustomerAgent updatedAgent)
    {
        if (updatedAgent == null || updatedAgent.id != id || string.IsNullOrEmpty(updatedAgent.lastname)) return BadRequest("Invalid data.");

        await _customerAgentRepository.UpdateAsync(updatedAgent);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _customerAgentRepository.DeleteAsync(id);
        return NoContent();
    }
}
