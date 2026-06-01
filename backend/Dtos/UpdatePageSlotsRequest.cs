namespace AlbumCopa.Api.Dtos;

public class UpdatePageSlotsRequest
{
    public List<int> StickerIds { get; set; } = new();
    public string Status { get; set; } = "Got";
    public int Quantity { get; set; } = 1;
}
