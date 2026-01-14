namespace czyt_AI_ka.Components.Backend.Models.Tribute;

public static class TributeAssetConfig
{
    public static readonly IReadOnlyDictionary<string, string> TownImagePaths =
        new Dictionary<string, string>
        {
            ["Gniezno"] = "games/tribute/gniezno.png",
            ["Giecz"] = "games/tribute/giecz.png",
            ["Ostrów"] = "games/tribute/ostrow_lednicki.png",
            ["Lednicki"] = "games/tribute/ostrow_lednicki.png",
            ["Kruszwica"] = "games/tribute/kruszwica.png",
            ["Poznań"] = "games/tribute/poznan.png",
            ["Kraków"] = "games/tribute/krakow.png",
            ["Grzybów"] = "games/tribute/grzybow.png"
        };
}
