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

        public IReadOnlyList<LiterkiResult> GetLiterkiResults(Guid userId, LiterkiGameMode mode)
        {
            return archive.LiterkiResults
                .Where(result => result.UserId == userId && result.Mode == mode)
                .OrderByDescending(result => result.PlayedAt)
                .ToList();
        }

        public IReadOnlyList<MathResult> GetMathResults(Guid userId, MathGameMode mode)
        {
            return archive.MathResults
                .Where(result => result.UserId == userId && result.Mode == mode)
                .OrderByDescending(result => result.PlayedAt)
                .ToList();
        }

        public void AddReadingResult(ReadingResult result)
        {
            archive.ReadingResults.Add(result);
            SaveResults();
            NotifyStateChanged();
        }

        public void AddLiterkiResult(LiterkiResult result)
        {
            archive.LiterkiResults.Add(result);
            SaveResults();
            NotifyStateChanged();
        }

        public void AddMathResult(MathResult result)
        {
            archive.MathResults.Add(result);
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

            archive.LiterkiResults.Clear();
            if (loadedArchive.LiterkiResults is not null)
            {
                archive.LiterkiResults.AddRange(loadedArchive.LiterkiResults);
            }

            archive.MathResults.Clear();
            if (loadedArchive.MathResults is not null)
            {
                archive.MathResults.AddRange(loadedArchive.MathResults);
            }
        }

        private void SaveResults()
        {
            var json = JsonSerializer.Serialize(archive, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(resultsFilePath, json);
        }
    }
}
