using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using czyt_AI_ka.Components.Backend.Models;
using Microsoft.Maui.Storage;

namespace czyt_AI_ka.Components.Backend
{
    public class ResultsArchive
    {
        private const string ResultsFileName = "results.json";
        private readonly string resultsFilePath;
        private readonly GameResultsArchive archive = new();

        public event Action? OnChange;

        public ResultsArchive()
        {
            var configurationDirectory = Path.Combine(FileSystem.Current.AppDataDirectory, "Configurations");
            Directory.CreateDirectory(configurationDirectory);
            resultsFilePath = Path.Combine(configurationDirectory, ResultsFileName);
            LoadResults();
        }

        public IReadOnlyList<ReadingResult> GetReadingResults(Guid userId)
        {
            return archive.ReadingResults
                .Where(result => result.UserId == userId)
                .OrderByDescending(result => result.PlayedAt)
                .ToList();
        }

        public void AddReadingResult(ReadingResult result)
        {
            archive.ReadingResults.Add(result);
            SaveResults();
            NotifyStateChanged();
        }

        private void NotifyStateChanged()
        {
            OnChange?.Invoke();
        }

        private void LoadResults()
        {
            if (!File.Exists(resultsFilePath))
            {
                return;
            }

            var json = File.ReadAllText(resultsFilePath);
            var loadedArchive = JsonSerializer.Deserialize<GameResultsArchive>(json);
            if (loadedArchive is null)
            {
                return;
            }

            archive.ReadingResults.Clear();
            if (loadedArchive.ReadingResults is not null)
            {
                archive.ReadingResults.AddRange(loadedArchive.ReadingResults);
            }
        }

        private void SaveResults()
        {
            var json = JsonSerializer.Serialize(archive, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(resultsFilePath, json);
        }
    }
}
