namespace AlbumCopa.Api.Dtos;

public class ImportStickerRequest
{
    public string Code { get; set; } = string.Empty;
    public int Number { get; set; }
    public string Country { get; set; } = string.Empty;
    public string GroupName { get; set; } = string.Empty;
    public int PageNumber { get; set; }
    public int SlotNumber { get; set; }
    public bool IsSpecial { get; set; }
}
