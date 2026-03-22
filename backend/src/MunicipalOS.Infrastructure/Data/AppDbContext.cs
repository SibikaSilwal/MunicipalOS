using Microsoft.EntityFrameworkCore;
using MunicipalOS.Domain.Enums;

namespace MunicipalOS.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Municipality> Municipalities => Set<Municipality>();
    public DbSet<User> Users => Set<User>();
    public DbSet<ServiceType> ServiceTypes => Set<ServiceType>();
    public DbSet<RequiredDocument> RequiredDocuments => Set<RequiredDocument>();
    public DbSet<WorkflowDefinition> WorkflowDefinitions => Set<WorkflowDefinition>();
    public DbSet<WorkflowStep> WorkflowSteps => Set<WorkflowStep>();
    public DbSet<DomainApplication> Applications => Set<DomainApplication>();
    public DbSet<ApplicationDocument> ApplicationDocuments => Set<ApplicationDocument>();
    public DbSet<ApplicationStatusHistory> ApplicationStatusHistories => Set<ApplicationStatusHistory>();
    public DbSet<ApplicationWorkflowStep> ApplicationWorkflowSteps => Set<ApplicationWorkflowStep>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // --- roles ---
        modelBuilder.Entity<Role>(e =>
        {
            e.ToTable("roles");
            e.HasKey(r => r.Id);
            e.Property(r => r.Id).ValueGeneratedOnAdd();
            e.Property(r => r.Name).IsRequired();
            e.HasIndex(r => r.Name).IsUnique();

            e.HasData(
                new Role { Id = Guid.Parse("a1b2c3d4-0001-0000-0000-000000000001"), Name = nameof(RoleName.Citizen) },
                new Role { Id = Guid.Parse("a1b2c3d4-0002-0000-0000-000000000002"), Name = nameof(RoleName.WardOfficer) },
                new Role { Id = Guid.Parse("a1b2c3d4-0003-0000-0000-000000000003"), Name = nameof(RoleName.MunicipalOfficer) },
                new Role { Id = Guid.Parse("a1b2c3d4-0004-0000-0000-000000000004"), Name = nameof(RoleName.Admin) }
            );
        });

        // --- municipalities ---
        modelBuilder.Entity<Municipality>(e =>
        {
            e.ToTable("municipalities");
            e.HasKey(m => m.Id);
            e.Property(m => m.Id).ValueGeneratedOnAdd();
            e.Property(m => m.Name).IsRequired();
        });

        // --- users ---
        modelBuilder.Entity<User>(e =>
        {
            e.ToTable("users");
            e.HasKey(u => u.Id);
            e.Property(u => u.Id).ValueGeneratedOnAdd();
            e.Property(u => u.Email).IsRequired();
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.PasswordHash).IsRequired();
            e.Property(u => u.FullName).IsRequired();
            e.Property(u => u.CreatedAt).IsRequired().HasDefaultValueSql("NOW()");

            e.HasOne(u => u.Role)
                .WithMany(r => r.Users)
                .HasForeignKey(u => u.RoleId);

            e.HasOne(u => u.Municipality)
                .WithMany(m => m.Users)
                .HasForeignKey(u => u.MunicipalityId);
        });

        // --- service_types ---
        modelBuilder.Entity<ServiceType>(e =>
        {
            e.ToTable("service_types");
            e.HasKey(s => s.Id);
            e.Property(s => s.Id).ValueGeneratedOnAdd();
            e.Property(s => s.Name).IsRequired();

            e.HasOne(s => s.Municipality)
                .WithMany(m => m.ServiceTypes)
                .HasForeignKey(s => s.MunicipalityId);
        });

        // --- required_documents ---
        modelBuilder.Entity<RequiredDocument>(e =>
        {
            e.ToTable("required_documents");
            e.HasKey(d => d.Id);
            e.Property(d => d.Id).ValueGeneratedOnAdd();
            e.Property(d => d.Name).IsRequired();
            e.Property(d => d.Required).IsRequired().HasDefaultValue(true);

            e.HasOne(d => d.ServiceType)
                .WithMany(s => s.RequiredDocuments)
                .HasForeignKey(d => d.ServiceTypeId);
        });

        // --- workflow_definitions ---
        modelBuilder.Entity<WorkflowDefinition>(e =>
        {
            e.ToTable("workflow_definitions");
            e.HasKey(w => w.Id);
            e.Property(w => w.Id).ValueGeneratedOnAdd();

            e.HasOne(w => w.ServiceType)
                .WithOne(s => s.WorkflowDefinition)
                .HasForeignKey<WorkflowDefinition>(w => w.ServiceTypeId);

            e.HasIndex(w => w.ServiceTypeId).IsUnique();
        });

        // --- workflow_steps ---
        modelBuilder.Entity<WorkflowStep>(e =>
        {
            e.ToTable("workflow_steps");
            e.HasKey(s => s.Id);
            e.Property(s => s.Id).ValueGeneratedOnAdd();
            e.Property(s => s.StepOrder).IsRequired();
            e.Property(s => s.RoleRequired).IsRequired();
            e.Property(s => s.StepName).IsRequired().HasDefaultValue("");
            e.Property(s => s.StepDescription);

            e.HasOne(s => s.WorkflowDefinition)
                .WithMany(w => w.Steps)
                .HasForeignKey(s => s.WorkflowDefinitionId);
        });

        // --- applications ---
        modelBuilder.Entity<DomainApplication>(e =>
        {
            e.ToTable("applications");
            e.HasKey(a => a.Id);
            e.Property(a => a.Id).ValueGeneratedOnAdd();
            e.Property(a => a.Status)
                .IsRequired()
                .HasConversion<string>();
            e.Property(a => a.CurrentStep).IsRequired().HasDefaultValue(1);
            e.Property(a => a.SubmittedAt).IsRequired().HasDefaultValueSql("NOW()");

            e.HasOne(a => a.Citizen)
                .WithMany(u => u.Applications)
                .HasForeignKey(a => a.CitizenId);

            e.HasOne(a => a.ServiceType)
                .WithMany(s => s.Applications)
                .HasForeignKey(a => a.ServiceTypeId);
        });

        // --- application_documents ---
        modelBuilder.Entity<ApplicationDocument>(e =>
        {
            e.ToTable("application_documents");
            e.HasKey(d => d.Id);
            e.Property(d => d.Id).ValueGeneratedOnAdd();
            e.Property(d => d.DocumentName).IsRequired();
            e.Property(d => d.FilePath).IsRequired();
            e.Property(d => d.UploadedAt).IsRequired().HasDefaultValueSql("NOW()");

            e.HasOne(d => d.Application)
                .WithMany(a => a.Documents)
                .HasForeignKey(d => d.ApplicationId);
        });

        // --- application_status_history ---
        modelBuilder.Entity<ApplicationStatusHistory>(e =>
        {
            e.ToTable("application_status_history");
            e.HasKey(h => h.Id);
            e.Property(h => h.Id).ValueGeneratedOnAdd();
            e.Property(h => h.Status).IsRequired();
            e.Property(h => h.ChangedAt).IsRequired().HasDefaultValueSql("NOW()");

            e.HasOne(h => h.Application)
                .WithMany(a => a.StatusHistory)
                .HasForeignKey(h => h.ApplicationId);

            e.HasOne(h => h.ChangedByUser)
                .WithMany()
                .HasForeignKey(h => h.ChangedBy);
        });

        // --- application_workflow_steps ---
        modelBuilder.Entity<ApplicationWorkflowStep>(e =>
        {
            e.ToTable("application_workflow_steps");
            e.HasKey(s => s.Id);
            e.Property(s => s.Id).ValueGeneratedOnAdd();
            e.Property(s => s.StepOrder).IsRequired();
            e.Property(s => s.Status)
                .IsRequired()
                .HasConversion<string>();
            e.Property(s => s.AssignedOn);
            e.Property(s => s.CompletedOn);

            e.HasOne(s => s.Application)
                .WithMany(a => a.WorkflowSteps)
                .HasForeignKey(s => s.ApplicationId);

            e.HasOne(s => s.WorkflowStep)
                .WithMany()
                .HasForeignKey(s => s.WorkflowStepId);

            e.HasOne(s => s.AssignedToUser)
                .WithMany()
                .HasForeignKey(s => s.AssignedToUserId);

            e.HasOne(s => s.CompletedByUser)
                .WithMany()
                .HasForeignKey(s => s.CompletedByUserId);

            e.HasIndex(s => new { s.ApplicationId, s.StepOrder }).IsUnique();
        });

        // --- audit_logs ---
        modelBuilder.Entity<AuditLog>(e =>
        {
            e.ToTable("audit_logs");
            e.HasKey(l => l.Id);
            e.Property(l => l.Id).ValueGeneratedOnAdd();
            e.Property(l => l.EventType).IsRequired();
            e.Property(l => l.Timestamp).IsRequired().HasDefaultValueSql("NOW()");
            e.Property(l => l.Metadata).HasColumnType("jsonb");

            e.HasOne(l => l.User)
                .WithMany()
                .HasForeignKey(l => l.UserId);

            e.HasOne(l => l.Application)
                .WithMany(a => a.AuditLogs)
                .HasForeignKey(l => l.ApplicationId);
        });

        // --- notifications ---
        modelBuilder.Entity<Notification>(e =>
        {
            e.ToTable("notifications");
            e.HasKey(n => n.Id);
            e.Property(n => n.Id).ValueGeneratedOnAdd();
            e.Property(n => n.Message).IsRequired();
            e.Property(n => n.IsRead).IsRequired().HasDefaultValue(false);
            e.Property(n => n.SentAt).IsRequired().HasDefaultValueSql("NOW()");

            e.HasOne(n => n.User)
                .WithMany(u => u.Notifications)
                .HasForeignKey(n => n.UserId);
        });
    }
}
