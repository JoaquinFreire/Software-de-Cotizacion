using Application.DTOs;
using Domain.Entities;
using Domain.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;

[ApiController]
[Route("api/customers")]
[Authorize]
public class CustomerController : ControllerBase
{
    private readonly ICustomerRepository _customerRepository;

    public CustomerController(ICustomerRepository customerRepository)
    {
        _customerRepository = customerRepository;
    }

    [HttpGet]
    public async Task<IEnumerable<Customer>> GetAll()
    {
        return await _customerRepository.GetAllAsync();
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var customer = await _customerRepository.GetByIdAsync(id);
        if (customer == null) return NotFound();
        return Ok(customer);
    }

    [HttpGet("dni/{dni}")]
    public async Task<IActionResult> GetByDni(string dni)
    {
        var customer = await _customerRepository.GetByDniAsync(dni);
        if (customer == null) return NotFound();
        return Ok(customer);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Customer newCustomer)
    {
        if (newCustomer == null) return BadRequest("Invalid data.");

        await _customerRepository.AddAsync(newCustomer);
        return CreatedAtAction(nameof(GetById), new { id = newCustomer.id }, newCustomer);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Customer updatedCustomer)
    {
        if (updatedCustomer == null || updatedCustomer.id != id) return BadRequest("Invalid data.");

        await _customerRepository.UpdateAsync(updatedCustomer);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _customerRepository.DeleteAsync(id);
        return NoContent();
    }

    [HttpGet("paged")]
    public async Task<ActionResult<PagedResultDTO<Customer>>> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        if (page < 1 || pageSize < 1) return BadRequest("Invalid pagination parameters.");
        var (items, total) = await _customerRepository.GetPagedAsync(page, pageSize);
        var result = new PagedResultDTO<Customer>
        {
            Items = items,
            Total = total
        };
        return Ok(result);
    }
}
