using Microsoft.Extensions.Configuration;
using OpenAI;
using OpenAI.Chat;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace czyt_AI_ka.Components.Backend.Clients
{
    public class ChatGptClient
    {
        private readonly OpenAIClient _client;

        public ChatGptClient(IConfiguration configuration)
        {
            var apiKey = configuration["OpenAI:ApiKey"];

            if (string.IsNullOrWhiteSpace(apiKey))
            {
                throw new InvalidOperationException("OpenAI API key not configured.");
            }

            _client = new OpenAIClient(apiKey);
        }

        public async Task<string> AskAsync(string prompt, string systemMessage = "")
        {
            if (string.IsNullOrWhiteSpace(prompt))
                throw new ArgumentException("Prompt cannot be null or empty.", nameof(prompt));

            var chatClient = _client.GetChatClient("gpt-4o-mini");

            var messages = new List<ChatMessage>();

            if (!string.IsNullOrWhiteSpace(systemMessage))
            {
                messages.Add(new SystemChatMessage(systemMessage));
            }

            messages.Add(new UserChatMessage(prompt));

            var result = await chatClient.CompleteChatAsync(
                messages,
                new ChatCompletionOptions
                {
                    MaxOutputTokenCount = 800
                });

            return result.Value.Content[0].Text;
        }
    }
}
