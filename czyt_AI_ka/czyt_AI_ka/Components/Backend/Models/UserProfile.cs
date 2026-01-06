using System;

namespace czyt_AI_ka.Components.Backend.Models
{
    public class UserProfile
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Name { get; set; } = string.Empty;
        public int Age { get; set; }
        public string Gender { get; set; } = string.Empty;
        public string ImagePath { get; set; } = string.Empty;
    }
}
