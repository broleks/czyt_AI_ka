using System;
using System.Collections.Generic;
using System.Linq;
using czyt_AI_ka.Components.Backend.Models;

namespace czyt_AI_ka.Components.Backend
{
    public class UserState
    {
        private readonly List<UserProfile> users = new();

        public IReadOnlyList<UserProfile> Users => users;

        public UserProfile? SelectedUser { get; private set; }

        public event Action? OnChange;

        public void AddUser(UserProfile user, bool selectUser = true)
        {
            users.Add(user);

            if (selectUser)
            {
                SelectedUser = user;
            }

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
    }
}
