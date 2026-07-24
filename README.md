# VibeUp 

VibeUp is a modern, high-performance Web Based music player built with React and Media3. It offers a seamless listening experience with a focus on deep audio customization, dynamic lyrics, and multilingual support.

## Features

- **Modern UI/UX**: Fully built with React following Material 3 guidelines.
- **Advanced Playback Engine**: Powered by Android Media3 (ExoPlayer) for stable and high-quality audio streaming and local playback.
- **Audio Effects Engine**:
  - 5-Band Equalizer with curated presets (Rock, Pop, Jazz, etc.).
  - Bass Boost and Virtualizer (Surround Sound).
  - Loudness Enhancer and Reverb presets.
  - Utilize Device's own Audio Effects.
- **Dynamic Lyrics**: Supports both synced (LRC) and plain text lyrics with tap-to-seek functionality.
- **Multilingual Lyrics (Native Languages)**: Display lyrics in the user's native language when available. Features include:
  - Support for multiple language tracks per song (original and translations).
  - Automatic language detection based on device locale with the option to manually switch languages.
- **Local Music Integration**: Scan and play music directly from your device storage.
- **Playlist Management**: Create, edit, and organize your music library into custom playlists.
- **Background Playback**: Persistent playback with modern MediaStyle notifications and seamless integration with Android's media controls.
- **Mini Player**: Always accessible playback controls while browsing the app.
- **Efficient Search Algorithm**: Uses JioSaavn's official API's to process search queries with song recommendations using popularity.
- 
## Tech Stack

- **Language**: [Kotlin](https://kotlinlang.org/)
- **UI Framework**: [Jetpack Compose](https://developer.android.com/jetpack/compose)
- **Navigation**: [Compose Navigation](https://developer.android.com/jetpack/compose/navigation)
- **Dependency Injection**: [Hilt](https://developer.android.com/training/dependency-injection/hilt-android)
- **Audio Engine**: [Android Media3 / ExoPlayer](https://developer.android.com/guide/topics/media/media3)
- **Image Loading**: [Coil](https://coil-kt.github.io/coil/)
- **Local Database**: [Room](https://developer.android.com/training/data-storage/room)
- **Concurrency**: Kotlin Coroutines & Flow

## Project Structure

- `com.vibeup.android.presentation`: UI layers including Screens, ViewModels, and Compose Components.
- `com.vibeup.android.service`: Core background services including `MusicPlayerService`, `PlayerManager`, `AudioEffectsManager`, and `LyricsManager` (handles fetching, caching, syncing, and language selection for lyrics).
- `com.vibeup.android.domain`: Domain models and repository interfaces.
- `com.vibeup.android.ui.theme`: App styling, colors (Purple/Blue primary palette), and Typography.

## Getting Started

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Abenanthan/VibeUp-Music_Streaming_App
   ```
2. **Open in Android Studio**:
   - Ensure you have the latest version of Android Studio (Hedgehog or newer).
3. **Build and Run**:
   - The app requires Android 7.0 (API 24) or higher.
   - For notification controls on Android 13+, ensure you grant the notification permission on the first launch.
   - If you want to use translated lyrics or online lyric lookup, ensure the app has network permission and an optional lyrics provider API key configured in the app settings.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
