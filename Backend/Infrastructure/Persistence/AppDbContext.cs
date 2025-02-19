using Microsoft.EntityFrameworkCore;
using Domain.Entities;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>().ToTable("user"); // Forzar el nombre de la tabla en MySQL

        // Si UserRole es un ENUM, guardar como INT
        modelBuilder.Entity<User>()
             .HasOne(u => u.role)
                .WithMany()
                    .HasForeignKey(u => u.role_id)
                        .OnDelete(DeleteBehavior.Restrict);
        // Guarda el enum como número
    }
}
