using Microsoft.EntityFrameworkCore;
using Domain.Entities;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }  // Tabla User en la BD
    public DbSet<Quotation> Quotations { get; set; }  // Tabla en la BD
    public DbSet<Customer> Customers { get; set; }
    public DbSet<CustomerAgent> CustomerAgents { get; set; }
    public DbSet<WorkPlace> WorkPlaces { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>().ToTable("user");  // Enlaza la entidad con la tabla "user"
        modelBuilder.Entity<Quotation>().ToTable("quotation");
        modelBuilder.Entity<Customer>().ToTable("customer");
        modelBuilder.Entity<WorkPlace>().ToTable("workplace");


        // 🔹 Configurar LastEdit para que se almacene como DATE en la base de datos
        modelBuilder.Entity<Quotation>()
            .Property(q => q.LastEdit)
            .HasColumnType("DATETIME");

        modelBuilder.Entity<Quotation>()
            .Property(q => q.CreationDate)
            .HasColumnType("DATETIME");

        // Configura la relación entre User y UserRole
        modelBuilder.Entity<User>()
             .HasOne(u => u.role)
                .WithMany()
                    .HasForeignKey(u => u.role_id)
                        .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<WorkPlace>()
            .HasOne(w => w.WorkType)
            .WithMany()
            .HasForeignKey(w => w.workTypeId)
            .OnDelete(DeleteBehavior.Restrict);
        // Relación entre Quotation y Customer
        modelBuilder.Entity<Quotation>()
            .HasOne(q => q.Customer)
            .WithMany()
            .HasForeignKey(q => q.CustomerId)
            .HasPrincipalKey(c => c.id);
        // Relación entre Customer y CustomerAgent
        modelBuilder.Entity<Customer>()
            .HasOne(c => c.agent)
            .WithMany()
            .HasForeignKey(c => c.agentId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Customer>()
            .Property(c => c.registration_date)
            .HasColumnType("DATETIME");
    }
}
