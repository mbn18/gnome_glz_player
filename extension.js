// extension.js
// GNOME Shell 47 Extension

import St from 'gi://St';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import Gst from 'gi://Gst';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

// URL of the MP3 to play
const MP3_URL = "http://glzwizzlv.bynetcdn.com/glz_mp3?awCollectionId=misc&awEpisodeId=glz";

// Debug logging
function debug(message) {
    log(`[GLZ Player] ${message}`);
}

// Initialize GStreamer
Gst.init(null);

let indicator = null;

const Mp3Player = GObject.registerClass(
    class Mp3Player extends PanelMenu.Button {
        _init() {
            super._init(0.0, "MP3 Player");

            // Create the play icon
            let icon = new St.Icon({
                icon_name: 'media-playback-start-symbolic',
                style_class: 'system-status-icon'
            });
            this.add_child(icon);
            
            // Create the stop icon (will be used when playing)
            this._stopIcon = new St.Icon({
                icon_name: 'media-playback-stop-symbolic',
                style_class: 'system-status-icon'
            });
            
            // Add toggle action to button
            this.connect('button-press-event', this._togglePlayback.bind(this));
            
            // Create menu
            this._buildMenu();
            
            // Initialize state
            this._isPlaying = false;
            this._player = null;
        }
        
        _buildMenu() {
            // URL entry
            this._urlItem = new PopupMenu.PopupMenuItem("URL: " + MP3_URL);
            this.menu.addMenuItem(this._urlItem);
            
            // Separator
            this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
            
            // Play/Stop button in menu
            this._playStopItem = new PopupMenu.PopupMenuItem("Play");
            this._playStopItem.connect('activate', this._togglePlayback.bind(this));
            this.menu.addMenuItem(this._playStopItem);
            
            // Change URL option
            let changeUrlItem = new PopupMenu.PopupMenuItem("Change URL...");
            changeUrlItem.connect('activate', this._changeUrl.bind(this));
            this.menu.addMenuItem(changeUrlItem);
        }
        
        _togglePlayback() {
            debug('Toggle playback called, current state: ' + (this._isPlaying ? 'playing' : 'stopped'));
            if (this._isPlaying) {
                this._stopPlayback();
            } else {
                this._startPlayback();
            }
            return true;
        }
        
        _startPlayback() {
            if (this._isPlaying) return;
            
            debug('Starting playback: ' + MP3_URL);
            try {
                // Use GStreamer directly via Gst
                this._player = Gst.ElementFactory.make("playbin", "player");
                if (!this._player) {
                    debug('Failed to create playbin element');
                    return;
                }
                
                this._player.set_property('uri', MP3_URL);
                
                // Create a bus to watch for messages
                let bus = this._player.get_bus();
                bus.add_signal_watch();
                this._busId = bus.connect('message', (bus, message) => {
                    switch (message.type) {
                        case Gst.MessageType.ERROR:
                            let [error, debug_info] = message.parse_error();
                            debug(`Error: ${error.message} (${debug_info})`);
                            this._stopPlayback();
                            break;
                        case Gst.MessageType.EOS:
                            debug('End of stream');
                            this._stopPlayback();
                            break;
                        case Gst.MessageType.STATE_CHANGED:
                            if (message.src === this._player) {
                                let [old_state, new_state, pending_state] = message.parse_state_changed();
                                debug(`State changed from ${old_state} to ${new_state}, pending ${pending_state}`);
                            }
                            break;
                    }
                });
                
                // Start playback
                let ret = this._player.set_state(Gst.State.PLAYING);
                if (ret === Gst.StateChangeReturn.FAILURE) {
                    debug('Failed to start playback');
                    this._player.set_state(Gst.State.NULL);
                    this._player = null;
                    return;
                }
                
                this._isPlaying = true;
                
                // Change icon to stop
                if (this.child) {
                    this.remove_child(this.child);
                }
                this.add_child(this._stopIcon);
                
                // Update menu item
                this._playStopItem.label.text = "Stop";
                
                // Log success message
                debug('Playback started: ' + MP3_URL);
            } catch (e) {
                debug('Exception while starting playback: ' + e.message);
                logError(e, "Failed to start playback");
                
                if (this._player) {
                    this._player.set_state(Gst.State.NULL);
                    this._player = null;
                }
            }
        }
        
        _stopPlayback() {
            debug('Stopping playback');
            if (!this._isPlaying) return;
            
            if (this._player) {
                let bus = this._player.get_bus();
                if (this._busId) {
                    bus.disconnect(this._busId);
                    this._busId = null;
                }
                bus.remove_signal_watch();
                
                this._player.set_state(Gst.State.NULL);
                this._player = null;
            }
            
            this._isPlaying = false;
            
            // Change icon back to play
            debug('Changing icon back to play');
            if (this.child) {
                this.remove_child(this.child);
            }
            this.add_child(new St.Icon({
                icon_name: 'media-playback-start-symbolic',
                style_class: 'system-status-icon'
            }));
            
            // Update menu item
            this._playStopItem.label.text = "Play";
            debug('Playback ended completely');
        }
        
        _changeUrl() {
            // This would ideally use a dialog, but for simplicity, 
            // we'll use a notification and zenity (asynchronously)
            Main.notify("MP3 Player", "Opening URL change dialog...");
            
            try {
                // Run zenity asynchronously to avoid freezing the UI
                let proc = Gio.Subprocess.new(
                    ['zenity', '--entry', '--title=Change MP3 URL', 
                     '--text=Enter new MP3 URL:', `--entry-text=${MP3_URL}`],
                    Gio.SubprocessFlags.STDOUT_PIPE
                );
                
                // Set up callbacks for when the process finishes
                proc.communicate_utf8_async(null, null, (proc, result) => {
                    try {
                        let [, stdout, stderr] = proc.communicate_utf8_finish(result);
                        let status = proc.get_exit_status();
                        
                        if (status === 0 && stdout) {
                            let newUrl = stdout.trim();
                            if (newUrl && newUrl !== MP3_URL) {
                                // In a real extension, you'd save this to settings
                                // For this example, we'll just update the variable
                                // Note: This won't persist across extension restarts
                                MP3_URL = newUrl;
                                this._urlItem.label.text = "URL: " + MP3_URL;
                                Main.notify("MP3 Player", "URL updated successfully");
                            }
                        }
                    } catch (e) {
                        debug('Error processing zenity result: ' + e.message);
                        logError(e, "Failed to process URL change");
                    }
                });
                
            } catch (e) {
                debug('Failed to launch zenity: ' + e.message);
                logError(e, "Failed to change URL");
                Main.notify("MP3 Player", "Failed to open URL change dialog");
            }
        }
        
        destroy() {
            debug('Destroying player');
            if (this._isPlaying) {
                this._stopPlayback();
            }
            super.destroy();
            debug('Player destroyed');
        }
    }
);

export default class GlzPlayerExtension extends Extension {
    enable() {
        debug('Enabling GLZ Player extension');
        indicator = new Mp3Player();
        Main.panel.addToStatusArea('mp3-player', indicator);
        debug('GLZ Player extension enabled');
    }

    disable() {
        debug('Disabling GLZ Player extension');
        if (indicator) {
            indicator.destroy();
            indicator = null;
            debug('GLZ Player extension disabled');
        }
    }
}
