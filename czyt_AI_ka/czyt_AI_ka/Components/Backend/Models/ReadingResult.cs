using System;

namespace czyt_AI_ka.Components.Backend.Models
{
    public sealed class ReadingResult
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid UserId { get; set; }
        public string PlayerName { get; set; } = string.Empty;
        public DateTime PlayedAt { get; set; }
        public int WordCount { get; set; }
        public double WordsPerMinute { get; set; }
        public int GameDurationSeconds { get; set; }

        public TimeSpan GameDuration => TimeSpan.FromSeconds(GameDurationSeconds);
    }
}
