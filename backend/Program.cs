using AlbumCopa.Api.Data;
using AlbumCopa.Api.Dtos;
using AlbumCopa.Api.Models;
using AlbumCopa.Api.Seed;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.UseUrls("http://localhost:5000");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=album-copa-2026.db"));

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowAnyOrigin();
    });
});

var app = builder.Build();

app.UseCors("Frontend");

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await StickerSeed.SeedAsync(db);
}

app.MapGet("/", () => Results.Ok(new
{
    app = "Album Copa 2026 API",
    version = "1.4",
    status = "online",
    endpoints = new[]
    {
        "/api/dashboard",
        "/api/stickers",
        "/api/stickers/missing",
        "/api/stickers/owned",
        "/api/stickers/duplicates",
        "/api/stickers/import",
        "/api/selections",
        "/api/selections/{prefix}",
        "/api/pages/{pageNumber}/mark-owned",
        "/api/pages/{pageNumber}/slots/status",
        "/api/collection/reset"
    }
}));

app.MapGet("/api/dashboard", async (AppDbContext db) =>
{
    var total = await db.UserStickers.CountAsync();
    var owned = await db.UserStickers.CountAsync(x => x.Status == StickerStatus.Got || x.Status == StickerStatus.Duplicate);
    var missing = await db.UserStickers.CountAsync(x => x.Status == StickerStatus.Need);
    var duplicates = await db.UserStickers.CountAsync(x => x.Status == StickerStatus.Duplicate);
    var specialMissing = await db.UserStickers
        .Include(x => x.Sticker)
        .CountAsync(x => x.Sticker.IsSpecial && x.Status == StickerStatus.Need);
    var specialTotal = await db.Stickers.CountAsync(x => x.IsSpecial);

    var progress = total == 0 ? 0 : Math.Round((owned * 100.0) / total, 2);

    return Results.Ok(new
    {
        total,
        owned,
        missing,
        duplicates,
        specialMissing,
        specialTotal,
        progress
    });
});

app.MapGet("/api/stickers", async (
    AppDbContext db,
    string? status,
    string? search,
    int? pageNumber,
    bool? special) =>
{
    var query = db.UserStickers
        .Include(x => x.Sticker)
        .AsQueryable();

    if (!string.IsNullOrWhiteSpace(status) && TryParseStatus(status, out var parsedStatus))
        query = query.Where(x => x.Status == parsedStatus);

    if (!string.IsNullOrWhiteSpace(search))
    {
        var term = search.Trim().ToLower();
        query = query.Where(x =>
            x.Sticker.Code.ToLower().Contains(term) ||
            x.Sticker.Country.ToLower().Contains(term) ||
            x.Sticker.GroupName.ToLower().Contains(term));
    }

    if (pageNumber.HasValue)
        query = query.Where(x => x.Sticker.PageNumber == pageNumber.Value);

    if (special.HasValue)
        query = query.Where(x => x.Sticker.IsSpecial == special.Value);

    var result = await query
        .OrderBy(x => x.Sticker.Number)
        .Select(x => new
        {
            x.Sticker.Id,
            x.Sticker.Code,
            x.Sticker.Number,
            x.Sticker.Country,
            x.Sticker.GroupName,
            x.Sticker.PageNumber,
            x.Sticker.SlotNumber,
            x.Sticker.IsSpecial,
            Status = x.Status.ToString(),
            x.Quantity,
            x.UpdatedAt
        })
        .ToListAsync();

    return Results.Ok(result);
});


app.MapGet("/api/selections", async (AppDbContext db) =>
{
    var items = await db.UserStickers
        .Include(x => x.Sticker)
        .OrderBy(x => x.Sticker.Number)
        .Select(x => new
        {
            x.Sticker.Id,
            x.Sticker.Code,
            x.Sticker.Number,
            x.Sticker.Country,
            x.Sticker.GroupName,
            x.Sticker.PageNumber,
            x.Sticker.SlotNumber,
            x.Sticker.IsSpecial,
            Status = x.Status.ToString(),
            x.Quantity
        })
        .ToListAsync();

    var result = items
        .GroupBy(x => new
        {
            Prefix = GetStickerPrefix(x.Code),
            x.Country,
            x.GroupName,
            x.PageNumber
        })
        .Select(g =>
        {
            var total = g.Count();
            var owned = g.Count(x => x.Status == StickerStatus.Got.ToString() || x.Status == StickerStatus.Duplicate.ToString());
            var missing = g.Count(x => x.Status == StickerStatus.Need.ToString());
            var duplicates = g.Count(x => x.Status == StickerStatus.Duplicate.ToString());
            var specials = g.Count(x => x.IsSpecial);

            return new
            {
                prefix = g.Key.Prefix,
                country = g.Key.Country,
                groupName = g.Key.GroupName,
                pageNumber = g.Key.PageNumber,
                total,
                owned,
                missing,
                duplicates,
                specials,
                progress = total == 0 ? 0 : Math.Round((owned * 100.0) / total, 2),
                firstCode = g.OrderBy(x => x.SlotNumber).First().Code,
                lastCode = g.OrderByDescending(x => x.SlotNumber).First().Code
            };
        })
        .OrderBy(x => x.pageNumber)
        .ToList();

    return Results.Ok(result);
});

app.MapGet("/api/selections/{prefix}", async (string prefix, AppDbContext db) =>
{
    var normalized = prefix.Trim().ToUpperInvariant();

    var result = await db.UserStickers
        .Include(x => x.Sticker)
        .Where(x => x.Sticker.Code.ToUpper().StartsWith(normalized + "-"))
        .OrderBy(x => x.Sticker.SlotNumber)
        .Select(x => new
        {
            x.Sticker.Id,
            x.Sticker.Code,
            x.Sticker.Number,
            x.Sticker.Country,
            x.Sticker.GroupName,
            x.Sticker.PageNumber,
            x.Sticker.SlotNumber,
            x.Sticker.IsSpecial,
            Status = x.Status.ToString(),
            x.Quantity
        })
        .ToListAsync();

    return Results.Ok(result);
});

app.MapGet("/api/pages/{pageNumber:int}", async (int pageNumber, AppDbContext db) =>
{
    var result = await db.UserStickers
        .Include(x => x.Sticker)
        .Where(x => x.Sticker.PageNumber == pageNumber)
        .OrderBy(x => x.Sticker.SlotNumber)
        .Select(x => new
        {
            x.Sticker.Id,
            x.Sticker.Code,
            x.Sticker.Number,
            x.Sticker.Country,
            x.Sticker.GroupName,
            x.Sticker.PageNumber,
            x.Sticker.SlotNumber,
            x.Sticker.IsSpecial,
            Status = x.Status.ToString(),
            x.Quantity
        })
        .ToListAsync();

    return Results.Ok(result);
});

app.MapGet("/api/stickers/missing", async (AppDbContext db) =>
{
    var result = await db.UserStickers
        .Include(x => x.Sticker)
        .Where(x => x.Status == StickerStatus.Need)
        .OrderBy(x => x.Sticker.PageNumber)
        .ThenBy(x => x.Sticker.SlotNumber)
        .Select(x => new
        {
            x.Sticker.Id,
            x.Sticker.Code,
            x.Sticker.Number,
            x.Sticker.Country,
            x.Sticker.GroupName,
            x.Sticker.PageNumber,
            x.Sticker.SlotNumber,
            x.Sticker.IsSpecial
        })
        .ToListAsync();

    return Results.Ok(result);
});

app.MapGet("/api/stickers/owned", async (AppDbContext db) =>
{
    var result = await db.UserStickers
        .Include(x => x.Sticker)
        .Where(x => x.Status == StickerStatus.Got || x.Status == StickerStatus.Duplicate)
        .OrderBy(x => x.Sticker.Number)
        .Select(x => new
        {
            x.Sticker.Id,
            x.Sticker.Code,
            x.Sticker.Number,
            x.Sticker.Country,
            x.Sticker.GroupName,
            x.Sticker.PageNumber,
            x.Sticker.SlotNumber,
            x.Sticker.IsSpecial,
            Status = x.Status.ToString(),
            x.Quantity
        })
        .ToListAsync();

    return Results.Ok(result);
});

app.MapGet("/api/stickers/duplicates", async (AppDbContext db) =>
{
    var result = await db.UserStickers
        .Include(x => x.Sticker)
        .Where(x => x.Status == StickerStatus.Duplicate)
        .OrderBy(x => x.Sticker.Country)
        .ThenByDescending(x => x.Quantity)
        .ThenBy(x => x.Sticker.Number)
        .Select(x => new
        {
            x.Sticker.Id,
            x.Sticker.Code,
            x.Sticker.Number,
            x.Sticker.Country,
            x.Sticker.GroupName,
            x.Sticker.PageNumber,
            x.Sticker.SlotNumber,
            x.Sticker.IsSpecial,
            x.Quantity
        })
        .ToListAsync();

    return Results.Ok(result);
});

app.MapPost("/api/stickers/{id:int}/status", async (
    int id,
    UpdateStickerStatusRequest request,
    AppDbContext db) =>
{
    if (!TryParseStatus(request.Status, out var status))
        return Results.BadRequest(new { message = "Status inválido. Use Need, Got ou Duplicate." });

    var userSticker = await db.UserStickers.FirstOrDefaultAsync(x => x.StickerId == id);

    if (userSticker is null)
        return Results.NotFound(new { message = "Figurinha não encontrada." });

    userSticker.Status = status;
    userSticker.Quantity = status switch
    {
        StickerStatus.Need => 0,
        StickerStatus.Got => Math.Max(request.Quantity, 1),
        StickerStatus.Duplicate => Math.Max(request.Quantity, 2),
        _ => request.Quantity
    };
    userSticker.UpdatedAt = DateTime.UtcNow;

    await db.SaveChangesAsync();

    return Results.Ok(new
    {
        message = "Status atualizado com sucesso.",
        stickerId = id,
        status = userSticker.Status.ToString(),
        userSticker.Quantity
    });
});

app.MapPost("/api/pages/{pageNumber:int}/mark-owned", async (int pageNumber, AppDbContext db) =>
{
    if (pageNumber < 1)
        return Results.BadRequest(new { message = "Página inválida." });

    var items = await db.UserStickers
        .Include(x => x.Sticker)
        .Where(x => x.Sticker.PageNumber == pageNumber)
        .ToListAsync();

    if (items.Count == 0)
        return Results.NotFound(new { message = "Nenhuma figurinha encontrada para essa página." });

    foreach (var item in items)
    {
        if (item.Status != StickerStatus.Duplicate)
        {
            item.Status = StickerStatus.Got;
            item.Quantity = Math.Max(item.Quantity, 1);
        }

        item.UpdatedAt = DateTime.UtcNow;
    }

    await db.SaveChangesAsync();

    return Results.Ok(new
    {
        message = "Página marcada como tenho.",
        pageNumber,
        updated = items.Count
    });
});

app.MapPost("/api/pages/{pageNumber:int}/slots/status", async (
    int pageNumber,
    UpdatePageSlotsRequest request,
    AppDbContext db) =>
{
    if (pageNumber < 1)
        return Results.BadRequest(new { message = "Página inválida." });

    if (!TryParseStatus(request.Status, out var status))
        return Results.BadRequest(new { message = "Status inválido. Use Need, Got ou Duplicate." });

    var stickerIds = request.StickerIds
        .Where(id => id > 0)
        .Distinct()
        .ToList();

    if (stickerIds.Count == 0)
        return Results.BadRequest(new { message = "Nenhuma figurinha selecionada." });

    var items = await db.UserStickers
        .Include(x => x.Sticker)
        .Where(x => x.Sticker.PageNumber == pageNumber && stickerIds.Contains(x.StickerId))
        .ToListAsync();

    if (items.Count == 0)
        return Results.NotFound(new { message = "Nenhuma figurinha selecionada foi encontrada nessa página." });

    foreach (var item in items)
    {
        item.Status = status;
        item.Quantity = status switch
        {
            StickerStatus.Need => 0,
            StickerStatus.Got => Math.Max(request.Quantity, 1),
            StickerStatus.Duplicate => Math.Max(request.Quantity, 2),
            _ => request.Quantity
        };
        item.UpdatedAt = DateTime.UtcNow;
    }

    await db.SaveChangesAsync();

    return Results.Ok(new
    {
        message = "Espaços atualizados com sucesso.",
        pageNumber,
        status = status.ToString(),
        updated = items.Count
    });
});

app.MapPost("/api/stickers/import", async (List<ImportStickerRequest> request, AppDbContext db) =>
{
    if (request.Count == 0)
        return Results.BadRequest(new { message = "Lista vazia." });

    var errors = new List<string>();

    for (var i = 0; i < request.Count; i++)
    {
        var item = request[i];
        var row = i + 1;

        if (string.IsNullOrWhiteSpace(item.Code))
            errors.Add($"Linha {row}: código vazio.");

        if (item.Number <= 0)
            errors.Add($"Linha {row}: número inválido.");

        if (item.PageNumber <= 0)
            errors.Add($"Linha {row}: página inválida.");

        if (item.SlotNumber <= 0)
            errors.Add($"Linha {row}: slot inválido.");
    }

    var duplicatedCodes = request
        .Select(x => x.Code.Trim().ToUpperInvariant())
        .Where(x => !string.IsNullOrWhiteSpace(x))
        .GroupBy(x => x)
        .Where(g => g.Count() > 1)
        .Select(g => g.Key)
        .Take(10)
        .ToList();

    if (duplicatedCodes.Count > 0)
        errors.Add($"Códigos duplicados no CSV: {string.Join(", ", duplicatedCodes)}.");

    if (errors.Count > 0)
        return Results.BadRequest(new { message = string.Join(" ", errors.Take(8)) });

    db.UserStickers.RemoveRange(db.UserStickers);
    db.Stickers.RemoveRange(db.Stickers);
    await db.SaveChangesAsync();

    var stickers = request
        .OrderBy(x => x.Number)
        .Select(x => new Sticker
        {
            Code = x.Code.Trim(),
            Number = x.Number,
            Country = string.IsNullOrWhiteSpace(x.Country) ? "A definir" : x.Country.Trim(),
            GroupName = string.IsNullOrWhiteSpace(x.GroupName) ? "Base" : x.GroupName.Trim(),
            PageNumber = x.PageNumber,
            SlotNumber = x.SlotNumber,
            IsSpecial = x.IsSpecial
        })
        .ToList();

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

    return Results.Ok(new { message = "Base importada com sucesso.", total = stickers.Count });
});

app.MapDelete("/api/collection/reset", async (AppDbContext db) =>
{
    var items = await db.UserStickers.ToListAsync();

    foreach (var item in items)
    {
        item.Status = StickerStatus.Need;
        item.Quantity = 0;
        item.UpdatedAt = DateTime.UtcNow;
    }

    await db.SaveChangesAsync();

    return Results.Ok(new { message = "Coleção resetada com sucesso." });
});

app.Run();


static string GetStickerPrefix(string code)
{
    if (string.IsNullOrWhiteSpace(code))
        return "";

    var index = code.IndexOf('-');
    return index > 0 ? code[..index].ToUpperInvariant() : code.ToUpperInvariant();
}

static bool TryParseStatus(string? value, out StickerStatus status)
{
    status = StickerStatus.Need;

    if (string.IsNullOrWhiteSpace(value))
        return false;

    var normalized = value.Trim().ToLowerInvariant();

    status = normalized switch
    {
        "need" or "falta" or "faltando" => StickerStatus.Need,
        "got" or "tenho" or "owned" => StickerStatus.Got,
        "duplicate" or "repetida" or "repetido" or "dupe" => StickerStatus.Duplicate,
        _ => StickerStatus.Need
    };

    return normalized is "need" or "falta" or "faltando" or
        "got" or "tenho" or "owned" or
        "duplicate" or "repetida" or "repetido" or "dupe";
}
