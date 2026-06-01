using System.ComponentModel.DataAnnotations;

namespace AlbumCopa.Api.Models;

public class Sticker
{
    public int Id { get; set; }

    [MaxLength(30)]
    public string Code { get; set; } = string.Empty;

    public int Number { get; set; }

    [MaxLength(100)]
    public string Country { get; set; } = string.Empty;

    [MaxLength(100)]
    public string GroupName { get; set; } = string.Empty;

    public int PageNumber { get; set; }

    public int SlotNumber { get; set; }

    public bool IsSpecial { get; set; }

    public UserSticker? UserSticker { get; set; }
}
