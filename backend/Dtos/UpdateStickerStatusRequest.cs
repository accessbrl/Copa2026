namespace AlbumCopa.Api.Dtos;

public class UpdateStickerStatusRequest
{
    public string Status { get; set; } = "Need";
    public int Quantity { get; set; } = 0;
}
