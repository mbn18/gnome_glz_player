# GLZ Player GNOME Shell Extension

A simple GNOME Shell extension that adds a media player button to your top panel for streaming GLZ radio.

## Features

- Stream GLZ radio directly from the GNOME Shell top panel
- Play/stop functionality with a single click
- Change the stream URL through a convenient dialog
- Compatible with GNOME Shell 47

## Requirements

- GNOME Shell 47
- GStreamer (with good and bad plugins)
- zenity (for the URL change dialog)

## Installation

### Manual Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/mbn18/gnome-glz-player.git
   ```

2. Copy the extension to your GNOME Shell extensions directory:
   ```bash
   mkdir -p ~/.local/share/gnome-shell/extensions/glzPlayer@epoch.co.il
   cp -r gnome-glz-player/* ~/.local/share/gnome-shell/extensions/glzPlayer@epoch.co.il/
   ```

3. Restart GNOME Shell:
   - Press Alt+F2
   - Type 'r' (without quotes)
   - Press Enter

4. Enable the extension:
   - Open the Extensions app
   - Find "MP3 GLZ Player" in the list
   - Toggle the switch to enable it

### Installation from ZIP

1. Download the ZIP file from the repository
2. Extract the ZIP file
3. Copy the contents to `~/.local/share/gnome-shell/extensions/glzPlayer@epoch.co.il/`
4. Restart GNOME Shell and enable the extension as described above

## Usage

1. Click on the play button in the top panel to start streaming GLZ radio
2. Click on the stop button to stop the stream
3. Click on the button and select "Change URL..." from the menu to change the stream URL

## Troubleshooting

If you encounter issues:

1. Check the GNOME Shell logs for errors:
   ```bash
   journalctl -f -o cat /usr/bin/gnome-shell
   ```

2. Ensure GStreamer and its plugins are installed:
   ```bash
   # For Fedora
   sudo dnf install gstreamer1-plugins-good gstreamer1-plugins-bad-free
   
   # For Ubuntu/Debian
   sudo apt install gstreamer1.0-plugins-good gstreamer1.0-plugins-bad
   ```

3. Make sure zenity is installed:
   ```bash
   # For Fedora
   sudo dnf install zenity
   
   # For Ubuntu/Debian
   sudo apt install zenity
   ```

## Acknowledgments

- The GLZ radio station for providing the stream
- GNOME Shell developers for the extension API

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 