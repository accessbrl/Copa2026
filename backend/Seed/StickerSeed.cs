using AlbumCopa.Api.Data;
using AlbumCopa.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AlbumCopa.Api.Seed;

public static class StickerSeed
{
    private record TeamSeed(string GroupName, string Country, string Prefix);

    private static readonly TeamSeed[] Teams =
    [
        new("Grupo A", "África do Sul", "RSA"),
        new("Grupo A", "Coreia do Sul", "KOR"),
        new("Grupo A", "México", "MEX"),
        new("Grupo A", "República Tcheca", "CZE"),
        new("Grupo B", "Bósnia e Herzegovina", "BIH"),
        new("Grupo B", "Canadá", "CAN"),
        new("Grupo B", "Catar", "QAT"),
        new("Grupo B", "Suíça", "SUI"),
        new("Grupo C", "Brasil", "BRA"),
        new("Grupo C", "Escócia", "SCO"),
        new("Grupo C", "Haiti", "HAI"),
        new("Grupo C", "Marrocos", "MAR"),
        new("Grupo D", "Austrália", "AUS"),
        new("Grupo D", "Estados Unidos", "USA"),
        new("Grupo D", "Paraguai", "PAR"),
        new("Grupo D", "Turquia", "TUR"),
        new("Grupo E", "Alemanha", "GER"),
        new("Grupo E", "Costa do Marfim", "CIV"),
        new("Grupo E", "Curaçao", "CUW"),
        new("Grupo E", "Equador", "ECU"),
        new("Grupo F", "Holanda", "NED"),
        new("Grupo F", "Japão", "JPN"),
        new("Grupo F", "Suécia", "SWE"),
        new("Grupo F", "Tunísia", "TUN"),
        new("Grupo G", "Bélgica", "BEL"),
        new("Grupo G", "Egito", "EGY"),
        new("Grupo G", "Irã", "IRN"),
        new("Grupo G", "Nova Zelândia", "NZL"),
        new("Grupo H", "Arábia Saudita", "KSA"),
        new("Grupo H", "Cabo Verde", "CPV"),
        new("Grupo H", "Espanha", "ESP"),
        new("Grupo H", "Uruguai", "URU"),
        new("Grupo I", "França", "FRA"),
        new("Grupo I", "Iraque", "IRQ"),
        new("Grupo I", "Noruega", "NOR"),
        new("Grupo I", "Senegal", "SEN"),
        new("Grupo J", "Argélia", "ALG"),
        new("Grupo J", "Argentina", "ARG"),
        new("Grupo J", "Áustria", "AUT"),
        new("Grupo J", "Jordânia", "JOR"),
        new("Grupo K", "Colômbia", "COL"),
        new("Grupo K", "Portugal", "POR"),
        new("Grupo K", "RD Congo", "COD"),
        new("Grupo K", "Uzbequistão", "UZB"),
        new("Grupo L", "Croácia", "CRO"),
        new("Grupo L", "Gana", "GHA"),
        new("Grupo L", "Inglaterra", "ENG"),
        new("Grupo L", "Panamá", "PAN"),
    ];

    public static async Task SeedAsync(AppDbContext db)
    {
        await db.Database.EnsureCreatedAsync();

        var hasData = await db.Stickers.AnyAsync();
        var needsRealBase = true;

        if (hasData)
        {
            var total = await db.Stickers.CountAsync();
            var legacyGenericBase = await db.Stickers.AnyAsync(x => x.Code.StartsWith("STK"));
            var expectedTotal = Teams.Length * 20;
            needsRealBase = legacyGenericBase || total != expectedTotal;
        }

        if (hasData && !needsRealBase)
            return;

        if (hasData)
        {
            db.UserStickers.RemoveRange(db.UserStickers);
            db.Stickers.RemoveRange(db.Stickers);
            await db.SaveChangesAsync();
        }

        var stickers = BuildStickers();

        db.Stickers.AddRange(stickers);
        await db.SaveChangesAsync();

        db.UserStickers.AddRange(stickers.Select(s => new UserSticker
        {
            StickerId = s.Id,
            Status = StickerStatus.Need,
            Quantity = 0,
            UpdatedAt = DateTime.UtcNow
        }));

        await db.SaveChangesAsync();
    }

    private static List<Sticker> BuildStickers()
    {
        var stickers = new List<Sticker>();
        var number = 1;

        for (var teamIndex = 0; teamIndex < Teams.Length; teamIndex++)
        {
            var team = Teams[teamIndex];
            var pageNumber = teamIndex + 1;

            for (var slot = 1; slot <= 20; slot++)
            {
                stickers.Add(new Sticker
                {
                    Code = $"{team.Prefix}-{slot}",
                    Number = number,
                    Country = team.Country,
                    GroupName = team.GroupName,
                    PageNumber = pageNumber,
                    SlotNumber = slot,
                    IsSpecial = false
                });

                number++;
            }
        }

        return stickers;
    }
}