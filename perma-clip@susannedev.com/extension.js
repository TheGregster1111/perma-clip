const Me = imports.misc.extensionUtils.getCurrentExtension();
const check = imports.ui;
const { Meta, Gio, Shell, Clutter, St, GLib } = imports.gi;
const Adw = imports.gi;
const Main = imports.ui.main;
const BoxPointer = imports.ui.boxpointer;
const PopupMenu = imports.ui.popupMenu;
const PanelMenu = imports.ui.panelMenu;

//const sourceActor = new St.Widget();
//const menu = new PopupMenu.PopupMenu(sourceActor, 0.0, St.Side.TOP);
//const menuItem = new PopupMenu.PopupMenuItem('Menu Item');
let panelIcon;
let scrollView;
let menu;
const clipboard = St.Clipboard.get_default();
let interval;

let virtualKeyboard = null;
const getVirtualKeyboard = () => {
	if (virtualKeyboard) {
		return virtualKeyboard;
	}
	virtualKeyboard = Clutter.get_default_backend().get_default_seat().create_virtual_device(Clutter.InputDeviceType.KEYBOARD_DEVICE);
	return virtualKeyboard;
};

function init() {}

function getSettings()
{
	let GioSSS = Gio.SettingsSchemaSource;
	let schemaSource = GioSSS.new_from_directory(
		Me.dir.get_child("schemas").get_path(),
		GioSSS.get_default(),
		false
	);
	let schemaObj = schemaSource.lookup(
		'org.gnome.shell.extensions.perma-clip',
		true
	);

	if (!schemaObj)
	{
		throw new Error('Cannot find schemas');
	}

	return new Gio.Settings({ settings_schema : schemaObj });
}

function updateList()
{
	let settings = getSettings();
	let clip = settings.get_strv('clip')
	let clipNames = settings.get_strv('clipnames')
	
	menu.removeAll();

	menu.addAction("Edit", () => {
		imports.misc.extensionUtils.openPrefs();
	});

	for (let i = 0; i < 10; i++) {
		menu.addAction(clipNames[i], () => {
			getVirtualKeyboard().notify_keyval(Clutter.get_current_event_time(), Clutter.KEY_Escape, Clutter.KeyState.PRESSED);
			getVirtualKeyboard().notify_keyval(Clutter.get_current_event_time(), Clutter.KEY_Escape, Clutter.KeyState.RELEASED);
			clipboard.set_text(St.ClipboardType.CLIPBOARD, clip[i]);
			this.timeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 150, () => {
				getVirtualKeyboard().notify_keyval(Clutter.get_current_event_time(), Clutter.KEY_Control_L, Clutter.KeyState.RELEASED);
				getVirtualKeyboard().notify_keyval(Clutter.get_current_event_time(), Clutter.KEY_v, Clutter.KeyState.RELEASED);

				getVirtualKeyboard().notify_keyval(Clutter.get_current_event_time(), Clutter.KEY_Control_L, Clutter.KeyState.PRESSED);
				getVirtualKeyboard().notify_keyval(Clutter.get_current_event_time(), Clutter.KEY_v, Clutter.KeyState.PRESSED);
				getVirtualKeyboard().notify_keyval(Clutter.get_current_event_time(), Clutter.KEY_Control_L, Clutter.KeyState.RELEASED);
				getVirtualKeyboard().notify_keyval(Clutter.get_current_event_time(), Clutter.KEY_v, Clutter.KeyState.RELEASED);
				if (this.timeoutId) {
					GLib.Source.remove(this.timeoutId);
				}
				this.timeoutId = undefined;
				return GLib.SOURCE_REMOVE;
			});
		});
	}
}

//UNUSED
function showContextMenu() {
	getVirtualKeyboard().notify_keyval(Clutter.get_current_event_time(), Clutter.KEY_Control_L, Clutter.KeyState.RELEASED);
	getVirtualKeyboard().notify_keyval(Clutter.get_current_event_time(), Clutter.KEY_Control_L, Clutter.KeyState.PRESSED);
	getVirtualKeyboard().notify_keyval(Clutter.get_current_event_time(), Clutter.KEY_v, Clutter.KeyState.PRESSED);
	getVirtualKeyboard().notify_keyval(Clutter.get_current_event_time(), Clutter.KEY_Control_L, Clutter.KeyState.RELEASED);
	getVirtualKeyboard().notify_keyval(Clutter.get_current_event_time(), Clutter.KEY_v, Clutter.KeyState.RELEASED);
}

function enable()
{
	/* for (let importName in imports.misc.extensionUtils) {
		log(importName);
	} */

	let mode = Shell.ActionMode.ALL;
	let flag = Meta.KeyBindingFlags.NONE;
	//Main.wm.addKeybinding("shortcut", settings, flag, mode, showContextMenu);


	// Fix menu
	panelIcon = new PanelMenu.Button(0.0, 'Perma Clip', false);
	scrollView = new St.ScrollView();
	menu = new PopupMenu.PopupMenuSection();

	const icon = new St.Icon({
		icon_name: 'emblem-documents',
		style_class: 'system-status-icon',
	});
	panelIcon.add_child(icon);
	scrollView.add_actor(menu.actor);
	panelIcon.menu.box.add_child(scrollView);
	
	updateList();

	interval = setInterval(() => updateList(), 500);
	// Fix menu

	// Add the indicator to the panel
	Main.panel.addToStatusArea('perma-clip@susannedev.com', panelIcon);
}

function disable()
{
	panelIcon?.destroy();
    panelIcon = null;
	//Main.wm.removeKeybinding("shortcut");
	clearInterval(interval);
}