using System.Collections.Generic;

namespace czyt_AI_ka.Components.Backend.Models
{
    public sealed class GameResultsArchive
    {
        public List<ReadingResult> ReadingResults { get; set; } = new();
        public List<LiterkiResult> LiterkiResults { get; set; } = new();
        public List<MathResult> MathResults { get; set; } = new();
    }
}
