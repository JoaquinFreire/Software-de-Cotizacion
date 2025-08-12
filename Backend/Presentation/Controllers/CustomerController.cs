using Application.DTOs;
using Application.DTOs.CustomerDTOs.CreateCustomer;
using Application.DTOs.CustomerDTOs.GetCustomer;
using Application.DTOs.CustomerDTOs.UpdateCustomer;
using Application.Services;
using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;


[ApiController]
[Route("api/customers")]
[Authorize]
public class CustomerController : ControllerBase
{
    private readonly CustomerServices _customerServices;
    private readonly IMediator _mediator;
    private readonly IMapper _mapper;

    public CustomerController(CustomerServices customerServices, IMediator mediator, IMapper mapper)
    {
        _customerServices = customerServices;
        _mediator = mediator;
        _mapper = mapper;
    }

    [HttpGet]
    public async Task<IEnumerable<GetCustomerDTO>> GetAll()
    {
        var customers = await _customerServices.GetAllAsync();
        return _mapper.Map<IEnumerable<GetCustomerDTO>>(customers);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var customer = await _customerServices.GetByIdAsync(id);
        if (customer == null) return NotFound();
        var customerDTO = _mapper.Map<GetCustomerDTO>(customer);
        return Ok(customer);
    }

    [HttpGet("dni/{dni}")]
    public async Task<IActionResult> GetByDni(string dni)
    {
        var query = new GetCustomerQuery(dni);
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCustomerDTO customerDTO)
    {
        //if (newCustomer == null) return BadRequest("Invalid data.");

        var command = new CreateCustomerCommand { createCustomerDTO = customerDTO };
        
        var customerId = await _mediator.Send(command);

        return Ok(new { Message = "Cliente creado correctamente.", CustomerId = customerId });
    }

    [HttpPut("{DNI}")]
    public async Task<IActionResult> Update(string dni, [FromBody] UpdateCustomerDTO updatedCustomer)
    {
        var result = await _mediator.Send(new UpdateCustomerCommand (dni, updatedCustomer));
        return result ? Ok(new { Message = "Cliente actualizado correctamente." }) : BadRequest("No se pudo actualizar el cliente.");
        //if (updatedCustomer == null || updatedCustomer.id != id) return BadRequest("Invalid data.");

        //await _customerRepository.UpdateAsync(updatedCustomer);
        //return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _customerServices.DeleteAsync(id);
        return NoContent();
    }

    [HttpGet("paged")]
    public async Task<ActionResult<PagedResultDTO<GetCustomerDTO>>> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        if (page < 1 || pageSize < 1) return BadRequest("Invalid pagination parameters.");
        var (items, total) = await _customerServices.GetPagedAsync(page, pageSize);
        var result = new PagedResultDTO<GetCustomerDTO>
        {
            Items = _mapper.Map<IEnumerable<GetCustomerDTO>>(items),
            Total = total
        };
        return Ok(result);
    }
}
