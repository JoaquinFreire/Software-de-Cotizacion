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
    //public DbSet<Complement> Complements { get; set; }
    //public DbSet<ComplementType> ComplementTypes { get; set; }
    public DbSet<Opening_Type> Opening_Types { get; set; }
    public DbSet<AlumTreatment> AlumTreatments { get; set; }
    public DbSet<Price> Prices { get; set; }
    public DbSet<GlassType> GlassTypes { get; set; }
    public DbSet<UserInvitation> UserInvitations { get; set; }  // Tabla UserInvitation en la BD
    public DbSet<ComplementDoor> ComplementDoors { get; set; }
    public DbSet<ComplementPartition> ComplementPartitions { get; set; }
    public DbSet<ComplementRailing> ComplementRailings { get; set; }
    public DbSet<Coating> Coatings { get; set; }
    public DbSet<Opening_Configuration> Opening_Configurations { get; set; }

    public DbSet<Accesory> Accesories { get; set; } // Tabla Accesory en la BD


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>().ToTable("user");  // Enlaza la entidad con la tabla "user"
        modelBuilder.Entity<Quotation>().ToTable("quotation");
        modelBuilder.Entity<Customer>().ToTable("customer");
        modelBuilder.Entity<CustomerAgent>().ToTable("customeragent");
        modelBuilder.Entity<WorkPlace>().ToTable("workplace");
        modelBuilder.Entity<WorkType>().ToTable("worktype");
        //modelBuilder.Entity<Complement>().ToTable("complement");
        //modelBuilder.Entity<ComplementType>().ToTable("complement_type");
        modelBuilder.Entity<Opening_Type>().ToTable("opening_type");
        modelBuilder.Entity<AlumTreatment>().ToTable("alumTreatment");
        modelBuilder.Entity<Price>().ToTable("price");
        modelBuilder.Entity<GlassType>().ToTable("glass_type");
        modelBuilder.Entity<UserInvitation>().ToTable("userInvitations");
        modelBuilder.Entity<ComplementDoor>().ToTable("complement_door");
        modelBuilder.Entity<ComplementPartition>().ToTable("complement_partition");
        modelBuilder.Entity<ComplementRailing>().ToTable("complement_railing");
        modelBuilder.Entity<Coating>().ToTable("coating");
        modelBuilder.Entity<Opening_Configuration>().ToTable("opening_configuration");
        modelBuilder.Entity<Accesory>().ToTable("accessories"); 

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
        // NUEVO: Relación muchos a muchos
        modelBuilder.Entity<Customer>()
            .HasMany(c => c.Agents)
            .WithMany(a => a.Customers)
            .UsingEntity<Dictionary<string, object>>(
                "customer_agent_relation",
                j => j
                    .HasOne<CustomerAgent>()
                    .WithMany()
                    .HasForeignKey("id_agent") // <-- nombre real de la columna
                    .HasConstraintName("FK_CustomerAgent_Customer"),
                j => j
                    .HasOne<Customer>()
                    .WithMany()
                    .HasForeignKey("id_customer") // <-- nombre real de la columna
                    .HasConstraintName("FK_customer_agent_relation"),
                j =>
                {
                    j.HasKey("id_customer", "id_agent");
                    j.ToTable("customer_agent_relation");
                }
            );

        modelBuilder.Entity<Customer>()
            .Property(c => c.registration_date)
            .HasColumnType("DATETIME")
            .HasDefaultValueSql("GETDATE()"); // Establecer valor predeterminado como fecha actual

        //// Materiales
        //modelBuilder.Entity<Complement>()
        //    .HasOne(co => co.type)
        //    .WithMany()
        //    .HasForeignKey(m => m.type_id);
        //modelBuilder.Entity<Complement>()
        //    .Property(co => co.unit)
        //    .HasConversion<int>(); // Guarda el enum como INT en la base de datos

        modelBuilder.Entity<UserInvitation>()
        .HasOne(ui => ui.user)
        .WithMany()
        .HasForeignKey(ui => ui.user_id)
        .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Opening_Configuration>()
        .HasOne(oc => oc.Opening_Type)
        .WithMany()
        .HasForeignKey(oc => oc.opening_type_id)
        .OnDelete(DeleteBehavior.Restrict);
    }
}
