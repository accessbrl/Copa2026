namespace AlbumCopa.Api.Models;

public class UserSticker
{
    public int Id { get; set; }

    public int StickerId { get; set; }

    public Sticker Sticker { get; set; } = default!;

    public StickerStatus Status { get; set; } = StickerStatus.Need;

    public int Quantity { get; set; } = 0;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
