using Domain.Entities;
using Domain.Repositories;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;

public class CustomerAgentRepository : ICustomerAgentRepository
{
    private readonly AppDbContext _context;

    public CustomerAgentRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<CustomerAgent>> GetAllAsync()
    {
        return await _context.CustomerAgents.ToListAsync();
    }

    public async Task<CustomerAgent?> GetByIdAsync(int id)
    {
        return await _context.CustomerAgents.FindAsync(id);
    }

    public async Task AddAsync(CustomerAgent agent)
    {
        _context.CustomerAgents.Add(agent);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(CustomerAgent agent)
    {
        _context.CustomerAgents.Update(agent);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var agent = await GetByIdAsync(id);
        if (agent == null)
        {
            throw new KeyNotFoundException($"CustomerAgent with ID {id} not found.");
        }

        _context.CustomerAgents.Remove(agent);
        await _context.SaveChangesAsync();
    }
}
