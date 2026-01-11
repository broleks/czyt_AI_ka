using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

namespace czyt_AI_ka.Components;

public partial class SnakeGame : IAsyncDisposable
{
    private const string DefaultDifficulty = "Easy";

    private readonly string _canvasId = $"snake-canvas-{Guid.NewGuid():N}";
    private IJSObjectReference? _snakeApi;
    private DotNetObjectReference<SnakeGame>? _dotNetRef;

    private int _score;
    private int _highScore;
    private string _speedLabel = "Wolno";
    private string _gameState = "start";

    private bool _kidMode;
    private bool _soundEnabled = true;
    private string _difficulty = DefaultDifficulty;

    [Parameter]
    public int Height { get; set; } = 420;

    [Parameter]
    public bool KidModeDefault { get; set; }

    [Parameter]
    public string DifficultyDefault { get; set; } = DefaultDifficulty;

    [Parameter]
    public bool SoundDefault { get; set; } = true;

    [Inject]
    private IJSRuntime JsRuntime { get; set; } = default!;

    private string HeightPx => $"{Height}px";

    private static IReadOnlyList<DifficultyOption> DifficultyOptions =>
        new List<DifficultyOption>
        {
            new("Easy", "Łatwy"),
            new("Medium", "Średni"),
            new("Hard", "Trudny")
        };

    protected override void OnInitialized()
    {
        _kidMode = KidModeDefault;
        _soundEnabled = SoundDefault;
        _difficulty = string.IsNullOrWhiteSpace(DifficultyDefault) ? DefaultDifficulty : DifficultyDefault;
    }

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (!firstRender)
        {
            return;
        }

        _dotNetRef = DotNetObjectReference.Create(this);
        _snakeApi = await JsRuntime.InvokeAsync<IJSObjectReference>(
            "snakeGame.init",
            _canvasId,
            new
            {
                kidMode = _kidMode,
                difficulty = _difficulty,
                soundEnabled = _soundEnabled
            },
            _dotNetRef);
    }

    private async Task StartGame()
    {
        if (_snakeApi is null)
        {
            return;
        }

        await _snakeApi.InvokeVoidAsync("start");
    }

    private async Task PauseGame()
    {
        if (_snakeApi is null)
        {
            return;
        }

        await _snakeApi.InvokeVoidAsync("pause");
    }

    private async Task ResetGame()
    {
        if (_snakeApi is null)
        {
            return;
        }

        await _snakeApi.InvokeVoidAsync("reset");
    }

    private async Task SendDirection(string direction)
    {
        if (_snakeApi is null)
        {
            return;
        }

        await _snakeApi.InvokeVoidAsync("setDirection", direction);
    }

    private async Task OnDifficultyChanged(string value)
    {
        _difficulty = value;
        if (_snakeApi is null)
        {
            return;
        }

        await _snakeApi.InvokeVoidAsync("setDifficulty", value);
    }

    private async Task OnKidModeChanged(bool value)
    {
        _kidMode = value;
        if (_snakeApi is null)
        {
            return;
        }

        await _snakeApi.InvokeVoidAsync("setKidMode", value);
    }

    private async Task OnSoundChanged(bool value)
    {
        _soundEnabled = value;
        if (_snakeApi is null)
        {
            return;
        }

        await _snakeApi.InvokeVoidAsync("setSoundEnabled", value);
    }

    [JSInvokable]
    public Task OnScoreChanged(int score, int highScore, string speedLabel)
    {
        _score = score;
        _highScore = highScore;
        _speedLabel = speedLabel;
        StateHasChanged();
        return Task.CompletedTask;
    }

    [JSInvokable]
    public Task OnGameOver(int finalScore)
    {
        _score = finalScore;
        StateHasChanged();
        return Task.CompletedTask;
    }

    [JSInvokable]
    public Task OnStateChanged(string state)
    {
        _gameState = state;
        StateHasChanged();
        return Task.CompletedTask;
    }

    public async ValueTask DisposeAsync()
    {
        if (_snakeApi is not null)
        {
            await _snakeApi.InvokeVoidAsync("dispose");
            await _snakeApi.DisposeAsync();
        }

        _dotNetRef?.Dispose();
    }

    private sealed record DifficultyOption(string Value, string Label);
}
