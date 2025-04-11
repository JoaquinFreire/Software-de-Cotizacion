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
    public DbSet<WorkType> WorkTypes { get; set; }  // Agrega WorkType
    public DbSet<Complement> Complements { get; set; }
    public DbSet<ComplementType> ComplementTypes { get; set; }
    public DbSet<Opening_Type> Opening_Types { get; set; }
    public DbSet<AlumTreatment> AlumTreatments { get; set; }
    public DbSet<Price> Prices { get; set; }
    public DbSet<GlassType> GlassTypes { get; set; }



    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>().ToTable("user");  // Enlaza la entidad con la tabla "user"
        modelBuilder.Entity<Quotation>().ToTable("quotation");
        modelBuilder.Entity<Customer>().ToTable("customer");
        modelBuilder.Entity<CustomerAgent>().ToTable("customeragent");
        modelBuilder.Entity<WorkPlace>().ToTable("workplace");
        modelBuilder.Entity<WorkType>().ToTable("worktype");  
        modelBuilder.Entity<Complement>().ToTable("complement");
        modelBuilder.Entity<ComplementType>().ToTable("complement_type");
        modelBuilder.Entity<Opening_Type>().ToTable("opening_type");
        modelBuilder.Entity<AlumTreatment>().ToTable("alumTreatment");
        modelBuilder.Entity<Price>().ToTable("price");
        modelBuilder.Entity<GlassType>().ToTable("glass_type");

        // Configurar LastEdit para que se almacene como DATE en la base de datos
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

        // Relación entre Quotation y User
        modelBuilder.Entity<Quotation>()
            .HasOne(q => q.User)
            .WithMany()
            .HasForeignKey(q => q.UserId)
            .HasPrincipalKey(u => u.id);

        // Relación entre Quotation y WorkPlace
        modelBuilder.Entity<Quotation>()
            .HasOne(q => q.WorkPlace)
            .WithMany()
            .HasForeignKey(q => q.WorkPlaceId)
            .OnDelete(DeleteBehavior.Restrict);

        // Relación entre Customer y CustomerAgent
        modelBuilder.Entity<Customer>()
            .HasOne(c => c.agent)
            .WithMany()
            .HasForeignKey(c => c.agentId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Customer>()
            .Property(c => c.registration_date)
            .HasColumnType("DATETIME")
            .HasDefaultValueSql("GETDATE()"); // Establecer valor predeterminado como fecha actual

        // Materiales
        modelBuilder.Entity<Complement>()
            .HasOne(co => co.type)
            .WithMany()
            .HasForeignKey(m => m.type_id);
        modelBuilder.Entity<Complement>()
            .Property(co => co.unit)
            .HasConversion<int>(); // Guarda el enum como INT en la base de datos
    }
}
