using System;

namespace czyt_AI_ka.Components.Backend.Models
{
    public enum LiterkiGameMode
    {
        Arrange,
        Guess,
        FirstLetter
    }

    public sealed class LiterkiResult
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid UserId { get; set; }
        public string PlayerName { get; set; } = string.Empty;
        public DateTime PlayedAt { get; set; }
        public int GameDurationSeconds { get; set; }
        public LiterkiGameMode Mode { get; set; }

        public TimeSpan GameDuration => TimeSpan.FromSeconds(GameDurationSeconds);
    }
}
