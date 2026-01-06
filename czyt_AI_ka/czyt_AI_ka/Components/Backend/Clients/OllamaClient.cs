using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace czyt_AI_ka.Components.Backend.Clients
{
    public class OllamaClient
    {
        private readonly HttpClient _httpClient;

        private record OllamaRequest(
            [property: JsonPropertyName("model")] string Model,
            [property: JsonPropertyName("prompt")] string Prompt,
            [property: JsonPropertyName("stream")] bool Stream = false
        );

        private record OllamaResponse(
            [property: JsonPropertyName("response")] string Response
        );

        public OllamaClient()
        {
            _httpClient = new HttpClient
            {
                BaseAddress = new Uri("http://127.0.0.1:11434"),
                Timeout = TimeSpan.FromSeconds(240)
            };
        }

        public async Task<string> GenerateAsync(string prompt)
        {
            var request = new OllamaRequest("mwiewior/bielik", prompt, Stream: false);
            var httpResponse = new HttpResponseMessage();

            try
            {
                httpResponse = await _httpClient.PostAsJsonAsync("/api/generate", request);
                if (httpResponse.IsSuccessStatusCode)
                {
                    var json = await httpResponse.Content.ReadAsStringAsync();
                    var parsed = JsonSerializer.Deserialize<OllamaResponse>(json);
                    return parsed?.Response ?? string.Empty;
                }
                else
                {
                    return $"Błąd podczas pracy modelu: {httpResponse.StatusCode} {httpResponse.Content.ReadAsStringAsync()}";
                }
            }
            catch (Exception ex)
            {
                return $"Błąd funkcji GenerateAsync(): {ex.Message}";
            }
        }
    }
}
