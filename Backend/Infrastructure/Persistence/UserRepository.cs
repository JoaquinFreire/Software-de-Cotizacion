using Microsoft.EntityFrameworkCore;
using Domain.Entities;
using Domain.Repositories;

public class UserRepository : IUserRepository
{
    private readonly AppDbContext _context;

    public UserRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<User?> GetByLegajoAsync(string legajo)
    {
        return await _context.Users.FirstOrDefaultAsync(u => u.Legajo == legajo);
    }
}
