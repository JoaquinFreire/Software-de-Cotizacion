using Microsoft.EntityFrameworkCore;
using Domain.Entities;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }  // Tabla User en la BD

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>().ToTable("user");  // Enlaza la entidad con la tabla "user"

        // Configura la relación entre User y UserRole
        modelBuilder.Entity<User>()
             .HasOne(u => u.role)
                .WithMany()
                    .HasForeignKey(u => u.role_id)
                        .OnDelete(DeleteBehavior.Restrict);
    }
}
