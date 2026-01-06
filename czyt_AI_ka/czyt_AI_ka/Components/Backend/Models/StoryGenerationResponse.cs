using System;
using System.Collections.Generic;
using System.Text;

namespace czyt_AI_ka.Components.Backend.Models
{
    public class StoryGenerationResponse
    {
        public string title { get; set; }
        public string story { get; set; }
        public Question[] questions { get; set; }
    }

    public class Question
    {
        public string question { get; set; }
        public string[] options { get; set; }
        public int correctOptionIndex { get; set; }
    }
}
