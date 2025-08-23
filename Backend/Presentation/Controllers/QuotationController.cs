using Application.UseCases;
using Domain.Entities;
using Domain.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;

[ApiController]
[Route("api/quotations")]
[Authorize]
public class QuotationController : ControllerBase
{
    private readonly IQuotationRepository _quotationRepository;
    private readonly CreateQuotation _createQuotation;
    private readonly ICustomerRepository _customerRepository;
    private readonly IUserRepository _userRepository;
    private readonly IWorkPlaceRepository _workPlaceRepository;

    public QuotationController(IQuotationRepository quotationRepository, CreateQuotation createQuotation, ICustomerRepository customerRepository, IUserRepository userRepository, IWorkPlaceRepository workPlaceRepository) // Cambiado a IWorkPlaceRepository
    {
        _quotationRepository = quotationRepository;
        _createQuotation = createQuotation;
        _customerRepository = customerRepository;
        _userRepository = userRepository;
        _workPlaceRepository = workPlaceRepository; // Asignado
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 5, [FromQuery] string? status = null)
    {
        var query = _quotationRepository.Query();
        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(q => q.Status == status);
        }
        var total = await query.CountAsync();
        var quotations = await query
            .OrderByDescending(q => q.CreationDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
        Console.WriteLine("prueba!"+quotations);
        // Asegura que quotations siempre sea un array (nunca null)
        return Ok(new { total, quotations = quotations ?? new List<Quotation>() });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var quotation = await _quotationRepository.GetByIdAsync(id);
        if (quotation == null) return NotFound();
        return Ok(new
        {
            quotation.Id,
            quotation.CustomerId,
            quotation.UserId,
            quotation.WorkPlaceId,
            quotation.Status,
            quotation.TotalPrice,
            LastEdit = quotation.LastEdit.ToString("yyyy-MM-ddTHH:mm:ssZ"), // Formatear DateTime a string
            CreationDate = quotation.CreationDate.ToString("yyyy-MM-ddTHH:mm:ssZ"), // Formatear DateTime a string
            Customer = new
            {
                Customer = quotation.Customer == null ? null : new
                {
                    quotation.Customer.id,
                    quotation.Customer.name,
                    quotation.Customer.lastname,
                    quotation.Customer.tel,
                    quotation.Customer.mail,
                    quotation.Customer.address,
                    RegistrationDate = quotation.Customer.registration_date.ToString("yyyy-MM-ddTHH:mm:ssZ"), // Formatear DateTime a string
                    quotation.Customer.agentId
                }
            },
            WorkPlace = new
            {
                quotation.WorkPlace?.id,
                quotation.WorkPlace?.name,
                quotation.WorkPlace?.location,
                quotation.WorkPlace?.address,
                quotation.WorkPlace?.workTypeId
            }
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] QuotationFullRequest request)
    {
        // LOG DEL REQUEST RECIBIDO
        Console.WriteLine("Request recibido en /api/quotations:");
        Console.WriteLine(System.Text.Json.JsonSerializer.Serialize(request));
        Console.WriteLine("Contenido de customer.agent:");
        Console.WriteLine(request.customer.agent == null ? "AGENTE ES NULL" : System.Text.Json.JsonSerializer.Serialize(request.customer.agent));

        // Permitir totalPrice en 0 si hay aberturas o complementos
        bool hasOpenings = request?.openings != null && request.openings.Count > 0;
        bool hasComplements = request?.complements != null && request.complements.Count > 0;
        if (request == null || (!hasOpenings && !hasComplements))
            return BadRequest("Datos inválidos.");

        // 1. Agente (si viene en el payload)
        int? agentId = null;
        if (request.customer.agent != null)
        {
            Console.WriteLine("Creando agente...");
            var agent = new CustomerAgent
            {
                name = request.customer.agent.name,
                lastname = request.customer.agent.lastname,
                tel = request.customer.agent.tel,
                mail = request.customer.agent.mail
            };
            var dbContext = HttpContext.RequestServices.GetService(typeof(AppDbContext)) as AppDbContext;
            dbContext.CustomerAgents.Add(agent);
            await dbContext.SaveChangesAsync();
            agentId = agent.id;
            Console.WriteLine($"Agente creado con id: {agentId}");
        }
        else
        {
            Console.WriteLine("No se recibió agente en el payload.");
        }

        // 2. Cliente
        Customer customer = null;
        if (request.customer != null && !string.IsNullOrWhiteSpace(request.customer.dni))
        {
            customer = await _customerRepository.GetByDniAsync(request.customer.dni);
            if (customer == null)
            {
                customer = new Customer
                {
                    name = request.customer.name,
                    lastname = request.customer.lastname,
                    tel = request.customer.tel,
                    mail = request.customer.mail,
                    address = request.customer.address,
                    dni = request.customer.dni,
                    agentId = agentId // Asocia el agente creado
                };
                await _customerRepository.AddAsync(customer);
                Console.WriteLine($"Cliente creado con id: {customer.id} y agentId: {customer.agentId}");
            }
            else
            {
                Console.WriteLine($"Cliente ya existe con id: {customer.id} y agentId: {customer.agentId}");
            }
        }
        else
        {
            return BadRequest("Datos de cliente inválidos.");
        }

        // 2. WorkPlace
        WorkPlace workPlace = null;
        if (request.workPlace != null)
        {
            // Puedes buscar por nombre y dirección para evitar duplicados, o simplemente crear uno nuevo
            workPlace = new WorkPlace
            {
                name = request.workPlace.name,
                address = request.workPlace.address,
                workTypeId = int.TryParse(request.workPlace.workTypeId.ToString(), out var wtid) ? wtid : 1
            };
            await _workPlaceRepository.AddAsync(workPlace);
        }
        else
        {
            return BadRequest("Datos de espacio de trabajo inválidos.");
        }

        // Validar que haya al menos una abertura o un complemento
        hasOpenings = request.openings != null && request.openings.Count > 0;
        hasComplements = request.complements != null && request.complements.Count > 0;
        if (!hasOpenings && !hasComplements)
        {
            return BadRequest("Debe agregar al menos una abertura o un complemento.");
        }

        // 3. Crear la cotización
        var quotation = new Quotation
        {
            CustomerId = customer.id,
            UserId = int.TryParse(request.userId?.ToString(), out var uid) ? uid : 0,
            WorkPlaceId = workPlace.id,
            TotalPrice = request.totalPrice,
            Status = "pending",
            LastEdit = DateTime.UtcNow,
            CreationDate = DateTime.UtcNow
        };
        await _quotationRepository.AddAsync(quotation);

        // 4. (Opcional) Guardar aberturas y complementos relacionados si tienes tablas intermedias
        // Aquí deberías agregar la lógica para guardar en tablas intermedias si tu modelo lo requiere

        return CreatedAtAction(nameof(GetById), new { id = quotation.Id }, quotation);
    }
    [HttpGet("by-period")]
    public async Task<IActionResult> GetByPeriod([FromQuery] DateTime from, [FromQuery] DateTime to)
    {
        var quotations = await _quotationRepository.GetByPeriodAsync(from, to);
        return Ok(quotations);
    }
    

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusRequest request)
    {
        var quotation = await _quotationRepository.GetByIdAsync(id);
        if (quotation == null) return NotFound();

        quotation.Status = request.Status ?? quotation.Status;
        await _quotationRepository.UpdateAsync(quotation);

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _quotationRepository.DeleteAsync(id);
        return NoContent();
    }

    [HttpGet("advanced-search")]
    public async Task<IActionResult> AdvancedSearch(
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        [FromQuery] string? status = null,
        [FromQuery] decimal? approxTotalPrice = null,
        [FromQuery] DateTime? lastEditFrom = null,
        [FromQuery] int? userId = null,
        [FromQuery] string? customerDni = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 5
    )
    {
        var query = _quotationRepository.Query();

        if (from.HasValue)
            query = query.Where(q => q.CreationDate >= from.Value);
        if (to.HasValue)
            query = query.Where(q => q.CreationDate <= to.Value);
        if (!string.IsNullOrEmpty(status))
            query = query.Where(q => q.Status == status);
        if (approxTotalPrice.HasValue)
            query = query.Where(q => q.TotalPrice == approxTotalPrice.Value);
        if (lastEditFrom.HasValue)
            query = query.Where(q => q.LastEdit >= lastEditFrom.Value);
        if (userId.HasValue)
            query = query.Where(q => q.UserId == userId.Value);
        if (!string.IsNullOrEmpty(customerDni))
            query = query.Where(q => q.Customer.dni == customerDni);

        var total = await query.CountAsync();
        var quotations = await query
            .OrderByDescending(q => q.CreationDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new { total, quotations });
    }
}

public class UpdateStatusRequest
{
    public string? Status { get; set; }
}

public class QuotationFullRequest
{
    public Customer customer { get; set; }
    public WorkPlaceDto workPlace { get; set; }
    public List<OpeningDto> openings { get; set; }
    public List<ComplementDto> complements { get; set; }
    public string userId { get; set; }
    public decimal totalPrice { get; set; }
}

public class WorkPlaceDto
{
    public string name { get; set; }
    public string address { get; set; }
    public int workTypeId { get; set; }
}

public class OpeningDto
{
    public int typeId { get; set; }
    public double width { get; set; }
    public double height { get; set; }
    public int quantity { get; set; }
    public int treatmentId { get; set; }
    public int glassTypeId { get; set; }
    // Puedes agregar más campos si necesitas
}

public class ComplementDto
{
    public int id { get; set; }
    public int quantity { get; set; }
    public decimal price { get; set; }
    // Puedes agregar más campos si necesitas
}
