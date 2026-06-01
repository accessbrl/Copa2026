using AlbumCopa.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AlbumCopa.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Sticker> Stickers => Set<Sticker>();
    public DbSet<UserSticker> UserStickers => Set<UserSticker>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Sticker>()
            .HasIndex(s => s.Code)
            .IsUnique();

        modelBuilder.Entity<UserSticker>()
            .HasIndex(us => us.StickerId)
            .IsUnique();

        modelBuilder.Entity<UserSticker>()
            .HasOne(us => us.Sticker)
            .WithOne(s => s.UserSticker)
            .HasForeignKey<UserSticker>(us => us.StickerId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
