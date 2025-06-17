using Domain.Entities;
using Domain.Repositories;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

namespace Infrastructure.Persistence.Repositories;

public class UserInvitationRepository : IUserInvitationRepository
{
    private readonly AppDbContext _context;

    public UserInvitationRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<UserInvitation?> GetByTokenAsync(string token)
    {
        return await _context.UserInvitations
            .Include(ui => ui.user)
            .FirstOrDefaultAsync(ui => ui.token == token);
    }

    public async Task AddAsync(UserInvitation invitation)
    {
        _context.UserInvitations.Add(invitation);
        await _context.SaveChangesAsync();
    }

    public async Task MarkAsUsedAsync(int id)
    {
        var invitation = await _context.UserInvitations.FindAsync(id);
        if (invitation != null)
        {
            invitation.used = true;
            await _context.SaveChangesAsync();
        }
    }
}