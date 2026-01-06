using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using czyt_AI_ka.Components.Backend.Models;
using Microsoft.Maui.Storage;

namespace czyt_AI_ka.Components.Backend
{
    public class UserState
    {
        private const string UsersFileName = "users.json";
        private readonly List<UserProfile> users = new();
        private readonly string usersFilePath;

        public IReadOnlyList<UserProfile> Users => users;

        public UserProfile? SelectedUser { get; private set; }

        public event Action? OnChange;

        public UserState()
        {
            var configurationDirectory = Path.Combine(FileSystem.Current.AppDataDirectory, "Configurations");
            Directory.CreateDirectory(configurationDirectory);
            usersFilePath = Path.Combine(configurationDirectory, UsersFileName);
            LoadUsers();
        }

        public void AddUser(UserProfile user, bool selectUser = true)
        {
            users.Add(user);

            if (selectUser)
            {
                SelectedUser = user;
            }

            SaveUsers();
            NotifyStateChanged();
        }

        public void RemoveUser(Guid userId)
        {
            var user = users.FirstOrDefault(item => item.Id == userId);
            if (user is null)
            {
                return;
            }

            users.Remove(user);

            if (SelectedUser?.Id == userId)
            {
                SelectedUser = users.FirstOrDefault();
            }

            SaveUsers();
            NotifyStateChanged();
        }

        public void SelectUser(Guid userId)
        {
            SelectedUser = users.FirstOrDefault(user => user.Id == userId);
            NotifyStateChanged();
        }

        public void ClearSelection()
        {
            SelectedUser = null;
            NotifyStateChanged();
        }

        private void NotifyStateChanged()
        {
            OnChange?.Invoke();
        }

        private void LoadUsers()
        {
            if (!File.Exists(usersFilePath))
            {
                return;
            }

            var json = File.ReadAllText(usersFilePath);
            var loadedUsers = JsonSerializer.Deserialize<List<UserProfile>>(json);
            if (loadedUsers is null)
            {
                return;
            }

            users.Clear();
            users.AddRange(loadedUsers);
        }

        private void SaveUsers()
        {
            var json = JsonSerializer.Serialize(users, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(usersFilePath, json);
        }
    }
}
