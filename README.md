# DarkDex

A dark-themed, offline-capable desktop Pokédex application inspired by Shadow Lugia, built with Electron and powered by PokéAPI v2. Features comprehensive Pokémon data, advanced caching, sprite management, and audio integration.

![DarkDex](https://img.shields.io/badge/Electron-v26+-purple?style=flat-square)
![Node.js](https://img.shields.io/badge/Node.js-v16+-green?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

## 🌟 Features

### Core Functionality
- **Complete Pokédex**: Browse all 1300+ Pokémon from all generations (Gen I-IX)
- **Detailed Information**: Stats, abilities, types, moves, evolution chains, and descriptions
- **Advanced Search**: Search by name, ID, type, generation, and more
- **Smart Filtering**: Filter by generation, type, legendary status, and stat ranges
- **Multiple Sorting Options**: Sort by ID, name, stats, height, weight
- **Failed Download Recovery**: Automatic retry system for failed downloads with detailed tracking

### Sprite System
- **Multiple Sprite Sources**: Official PokéAPI sprites and Pokémon Showdown sprites
- **Animated Sprites**: Support for animated GIFs from Showdown
- **Shiny Variants**: Toggle between regular and shiny forms
- **Smart Caching**: Automatic local caching for offline use
- **Fast Loading**: Intelligent sprite preloading and optimization
- **Fallback System**: Graceful degradation when sprites fail to load

### Offline Capabilities
- **Complete Offline Mode**: Full functionality without internet connection
- **Local Caching**: All Pokémon data and sprites cached locally
- **Smart Sync**: Automatic updates when connection is restored
- **Connection Status**: Real-time online/offline indicator
- **Partial Cache Loading**: Loads available cached data when offline
- **Background Retry**: Failed downloads retry automatically in background

### Audio System
- **Pokémon Cries**: Play authentic Pokémon cries from PokéAPI
- **Lugia Cry**: Special Shadow Lugia cry for splash screen
- **Audio Caching**: Local storage of audio files for offline playback
- **Fallback Audio**: Procedurally generated sounds when downloads fail
- **Volume Control**: Adjustable audio settings

### Cache Management
- **Comprehensive Cache Stats**: Detailed breakdown of cache usage by type
- **Selective Cache Clearing**: Clear data, sprites, or audio cache independently
- **Failed Download Tracking**: Monitor and retry failed downloads
- **Cache Size Monitoring**: Real-time cache size and file count tracking
- **Smart Cache Recovery**: Automatic cache validation and repair

### User Interface
- **Shadow Lugia Theme**: Dark, mysterious design inspired by Shadow Lugia
- **Responsive Layout**: Adapts to different window sizes
- **Custom Title Bar**: Frameless window with custom controls
- **Enhanced Animations**: Smooth transitions, particle effects, and micro-interactions
- **Splash Screen**: Beautiful loading screen featuring Showdown Lugia
- **Keyboard Shortcuts**: Quick access via keyboard shortcuts
- **Progress Tracking**: Detailed loading progress with step-by-step status
- **Error Recovery UI**: User-friendly error handling and recovery options

## 🚀 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Quick Start
```bash
# Clone the repository
git clone https://github.com/Zirmith/darkdex.git

# Navigate to directory
cd darkdex

# Install dependencies
npm install

# Start the application
npm start
```

### Development
```bash
# Start in development mode
npm run dev
```

### Building
```bash
# Build for current platform
npm run build

# Build distributables
npm run dist
```

## ⌨️ Keyboard Shortcuts

- `Ctrl/Cmd + K` - Focus search input
- `Ctrl/Cmd + R` - Refresh data
- `Escape` - Clear search or close modal
- `F11` - Toggle fullscreen (development)

## 🎮 Usage

### Basic Navigation
1. **Search**: Use the search bar to find Pokémon by name or ID
2. **Filter**: Use the sidebar filters to narrow down results
3. **Browse**: Click any Pokémon card to view detailed information
4. **Evolve**: Click evolution chain Pokémon to navigate quickly

### Advanced Features
- **Sprite Options**: Toggle animated, shiny, and Showdown-style sprites
- **Dark Theme**: Immersive Shadow Lugia-inspired dark interface
- **Offline Mode**: Full functionality continues even without internet

### Pokemon Detail Modal
- **Overview**: Basic info, description, types, and abilities
- **Stats**: Detailed base stats with visual bars
- **Moves**: Organized by learn method (Level, TM, Egg, Tutor)
- **Evolution**: Interactive evolution chain navigation
- **Forms**: Alternative forms and variants
- **Locations**: Where to find the Pokémon in games
- **Audio**: Play Pokémon cries directly from the modal

### Cache Management Interface
- **Cache Statistics**: View detailed cache usage by category
- **Selective Clearing**: Clear specific cache types (data, sprites, audio)
- **Failed Downloads**: View and retry failed downloads
- **Storage Monitoring**: Real-time storage usage tracking

## 🛠️ Technical Details

### Architecture
- **Main Process**: `main.js` handles window management and IPC
- **Renderer Process**: `renderer.js` manages the UI and user interactions
- **API Layer**: `api.js` handles PokéAPI communication and caching
- **Sprite Management**: `sprites.js` manages sprite loading and caching
- **Search Engine**: `search.js` handles filtering and sorting
- **Audio System**: `audio.js` manages Pokémon cries and sound effects

### Caching Strategy
- **Memory Cache**: Fast in-memory cache for recently accessed data
- **File System Cache**: Persistent local storage in user data directory
- **Sprite Cache**: Local storage of all sprite variants for offline use
- **Smart Updates**: Automatic cache invalidation and updates
- **Audio Cache**: Local storage of Pokémon cries and sound effects
- **Failed Download Tracking**: Comprehensive retry system for failed resources
- **Cache Statistics**: Real-time monitoring of cache performance and usage

### Error Handling & Recovery
- **Graceful Degradation**: App continues working when resources fail to load
- **Automatic Retries**: Background retry system for failed downloads
- **Fallback Systems**: Alternative content when primary sources fail
- **User Feedback**: Clear error messages and recovery options
- **Offline Resilience**: Full functionality without internet connection

### Data Sources
- **PokéAPI v2**: Primary data source for Pokémon information
- **Pokémon Showdown**: High-quality animated sprites
- **PokéAPI Cries**: Authentic Pokémon sound effects
- **Local Cache**: Fallback for offline functionality

## 🌐 Offline Support

DarkDex is designed to work seamlessly offline:

1. **Initial Load**: First run requires internet to download data
2. **Smart Caching**: All accessed Pokémon data is cached locally
3. **Sprite Storage**: Images stored in user data directory
4. **Offline Indicator**: Status bar shows connection state
5. **Graceful Degradation**: App continues working without internet
6. **Partial Loading**: Loads available cached Pokémon when some data is missing
7. **Background Sync**: Automatically downloads missing data when connection returns
8. **Failed Download Recovery**: Tracks and retries failed downloads automatically

## 🎨 Customization

### Themes
- **Shadow Lugia Theme**: Dark, mysterious interface inspired by Shadow Lugia (default)
- **Custom CSS**: Easy theming via CSS variables

### Sprite Preferences
- **Animated vs Static**: Choose your preferred sprite style
- **Regular vs Shiny**: Toggle shiny variants
- **Showdown vs Official**: Different artistic styles

### Audio Preferences
- **Sound Toggle**: Enable/disable all audio
- **Volume Control**: Adjust audio volume levels
- **Cry Playback**: Toggle Pokémon cry playback

## 🐛 Troubleshooting

### Common Issues

**App won't start**
- Ensure Node.js v16+ is installed
- Run `npm install` to install dependencies
- Check console for error messages

**Sprites not loading**
- Check internet connection
- Clear cache: Delete `%APPDATA%/darkdex/cache` folder
- Restart application

**Slow performance**
- Disable animated sprites for better performance
- Clear sprite cache to free up disk space
- Close other resource-intensive applications
- Use cache management to monitor and optimize storage usage

**Audio not playing**
- Check if audio is enabled in settings
- Verify internet connection for initial audio downloads
- Clear audio cache and restart application
- Check system audio settings and permissions

**Failed downloads**
- Use Cache Management to view and retry failed downloads
- Check internet connection stability
- Clear all cache and restart for fresh download attempt
- Failed items will automatically retry in background when connection improves
### Cache Management
- **Location**: `%APPDATA%/darkdex/` (Windows) or `~/Library/Application Support/darkdex/` (macOS)
- **Clear Cache**: Delete cache and sprites folders
- **Size**: Approximately 800MB for complete dataset (data + sprites + audio)
- **Monitoring**: Use built-in Cache Management interface for detailed statistics
- **Selective Clearing**: Clear only specific cache types to preserve other data

## 🔄 Updates

DarkDex checks for updates automatically:
- **Data Updates**: Pokémon data refreshed from PokéAPI
- **Sprite Updates**: New sprites downloaded as available
- **Audio Updates**: New Pokémon cries added as they become available
- **Manual Refresh**: Use Ctrl/Cmd+R to force refresh
- **Background Updates**: Failed downloads retry automatically
- **Source Code Updates**: Automatic updates from GitHub repository

## 📊 Performance & Statistics

### Cache Performance
- **Hit Rate**: Monitor cache effectiveness
- **Storage Usage**: Track disk space usage by category
- **Download Success**: Monitor download success rates
- **Error Tracking**: Comprehensive error logging and recovery

### System Requirements
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: 1GB free space for complete cache
- **Network**: Internet connection required for initial setup
- **Graphics**: Hardware acceleration recommended for smooth animations

## 📱 Platform Support

- **Windows**: Windows 10/11 (x64)
- **macOS**: macOS 10.15+ (Intel & Apple Silicon)
- **Linux**: Ubuntu 18.04+ and equivalents (x64)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **PokéAPI**: Amazing free Pokémon API
- **PokéAPI Cries**: Authentic Pokémon sound database
- **Pokémon Showdown**: High-quality sprite resources
- **The Pokémon Company**: Original Pokémon designs and concepts
- **Electron Community**: Excellent desktop app framework
- **RemixIcon**: Beautiful icon set
- **GitHub**: Reliable hosting for assets and updates

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Zirmith/darkdex/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Zirmith/darkdex/discussions)
- **Email**: support@darkdex.com

---

**Made with ❤️ for Pokémon fans everywhere - Gotta Cache 'Em All!**
