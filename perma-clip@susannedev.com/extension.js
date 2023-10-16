const extensionUtils = imports.misc.extensionUtils;
const Me = extensionUtils.getCurrentExtension();
const check = imports.ui;
const { Meta, Gio, Shell, Clutter, St, GLib } = imports.gi;
const Main = imports.ui.main;
const BoxPointer = imports.ui.boxpointer;
const PopupMenu = imports.ui.popupMenu;
const PanelMenu = imports.ui.panelMenu;

let panelIcon;
let scrollView;
let menu;
let clipboard;
let interval;
let timeoutId;
let virtualKeyboard;

let settings;
let clip;
let clipNames;

function init() {}

function updateCheck ()
{
    let tempClip = settings.get_strv('clip');
    let tempClipNames = settings.get_strv('clipnames');
    
    for (let i = 0; i < clip.length; i += 1)
    {
        if (tempClip[i] !== clip[i])
        {
            updateList();
            return;
        }
    }

    for (let i = 0; i < clipNames.length; i += 1)
    {

        if (tempClipNames[i] !== clipNames[i])
        {
            updateList();
            return;
        }
    }
}

function updateList()
{
    settings = extensionUtils.getSettings();
    clip = settings.get_strv('clip');
    clipNames = settings.get_strv('clipnames');
    
    menu.removeAll();

    menu.addAction("Edit", () => {
        extensionUtils.openPrefs();
    });

    for (let i = 0; i < 10; i++) {
        menu.addAction(clipNames[i], () => {
            virtualKeyboard.notify_keyval(Clutter.get_current_event_time(), Clutter.KEY_Escape, Clutter.KeyState.PRESSED);
            virtualKeyboard.notify_keyval(Clutter.get_current_event_time(), Clutter.KEY_Escape, Clutter.KeyState.RELEASED);
            clipboard.set_text(St.ClipboardType.CLIPBOARD, clip[i]);
            timeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 150, () => {
                virtualKeyboard.notify_keyval(Clutter.get_current_event_time(), Clutter.KEY_Control_L, Clutter.KeyState.RELEASED);
                virtualKeyboard.notify_keyval(Clutter.get_current_event_time(), Clutter.KEY_v, Clutter.KeyState.RELEASED);

                virtualKeyboard.notify_keyval(Clutter.get_current_event_time(), Clutter.KEY_Control_L, Clutter.KeyState.PRESSED);
                virtualKeyboard.notify_keyval(Clutter.get_current_event_time(), Clutter.KEY_Shift_L, Clutter.KeyState.PRESSED);
                virtualKeyboard.notify_keyval(Clutter.get_current_event_time(), Clutter.KEY_v, Clutter.KeyState.PRESSED);
                virtualKeyboard.notify_keyval(Clutter.get_current_event_time(), Clutter.KEY_Control_L, Clutter.KeyState.RELEASED);
                virtualKeyboard.notify_keyval(Clutter.get_current_event_time(), Clutter.KEY_Shift_L, Clutter.KeyState.RELEASED);
                virtualKeyboard.notify_keyval(Clutter.get_current_event_time(), Clutter.KEY_v, Clutter.KeyState.RELEASED);
                
                timeoutId = null;
                return GLib.SOURCE_REMOVE;
            });
        });
    }
}

function enable()
{
    // Get user clipboard and create virtual keyboard
    clipboard = St.Clipboard.get_default();
    virtualKeyboard = Clutter.get_default_backend().get_default_seat().create_virtual_device(Clutter.InputDeviceType.KEYBOARD_DEVICE);
    // Get user clipboard and create virtual keyboard
    

    // Fix menu
    panelIcon = new PanelMenu.Button(0.0, 'Perma Clip', false);
    scrollView = new St.ScrollView();
    menu = new PopupMenu.PopupMenuSection();

    const icon = new St.Icon({
        icon_name: 'emblem-documents',
        style_class: 'system-status-icon'
    });
    panelIcon.add_child(icon);
    scrollView.add_actor(menu.actor);
    panelIcon.menu.box.add_child(scrollView);
    
    updateList();

    interval = setInterval(() => updateCheck(), 200);
    // Fix menu

    // Add the indicator to the panel
    Main.panel.addToStatusArea('perma-clip@susannedev.com', panelIcon);
}

function disable()
{
    panelIcon.destroy();
    panelIcon = null;
    scrollView.destroy();
    scrollView = null;
    menu.destroy();
    menu = null;
    virtualKeyboard = null;
    clipboard = null;
    settings = null;
    clearInterval(interval);
    
    if (timeoutId) {
        GLib.Source.remove(timeoutId);
    }
}