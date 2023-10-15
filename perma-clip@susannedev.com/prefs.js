const { GObject, Gtk, Gio, Adw } = imports.gi;
const Me = imports.misc.extensionUtils.getCurrentExtension();

let selected = 0;
let interval;

function update (dropDown, input1Buffer, input2Buffer, grid, clip, clipNames, interval)
{
	if (dropDown.get_selected() != selected)
	{
		selected = dropDown.get_selected();
		input1Buffer.set_text(clipNames[dropDown.get_selected()], clipNames[dropDown.get_selected()].length);
		input2Buffer.set_text(clip[dropDown.get_selected()], clip[dropDown.get_selected()].length);
	}
}

function init () 
{

}

function fillPreferencesWindow(window)
{
    let settings = imports.misc.extensionUtils.getSettings();
	let clip = settings.get_strv('clip')
	let clipNames = settings.get_strv('clipnames')

	let page = new Adw.PreferencesPage();
	let group = new Adw.PreferencesGroup();

    let grid = new Gtk.Grid();
	grid.set_row_homogeneous(true);
	grid.set_column_homogeneous(true);

    let dropDown = Gtk.DropDown.new_from_strings(Array.from({ length: 10 }, (v, i) => clipNames[i] )); //Have to do it this way for some reason.
    grid.attach(dropDown, 4, 1, 2, 1);

	let emptyLabel1 = new Gtk.Label();	//emptyLabelN items add space between menu items.
	grid.attach(emptyLabel1, 0, 2, 1, 1);

    let input1 = new Gtk.Entry();
	let input1Buffer = input1.get_buffer();
	input1Buffer.set_max_length(10);
	input1Buffer.set_text(clipNames[selected], clipNames[selected].length);
    grid.attach(input1, 1, 3, 8, 1);

	let emptyLabel2 = new Gtk.Label();
	grid.attach(emptyLabel2, 0, 4, 1, 1);

	let input2 = new Gtk.TextView();
	let input2Buffer = input2.get_buffer();
	input2.get_buffer().set_text(clip[selected], clip[selected].length);
    grid.attach(input2, 1, 5, 8, 3);

	let emptyLabel3 = new Gtk.Label();
	grid.attach(emptyLabel3, 0, 9, 1, 1);

	let button = new Gtk.Button();
	button.set_label("Submit");
	button.connect('clicked', 
	() => { //Update dropdown menu to match new clipNames and update database.
		clipNames[selected] = input1Buffer.get_text();
		clip[selected] = input2Buffer.get_text(input2Buffer.get_start_iter(), input2Buffer.get_end_iter(), false);
		settings.set_strv('clip', clip);
		settings.set_strv('clipnames', clipNames);

		grid.remove(dropDown);
		dropDown = Gtk.DropDown.new_from_strings(Array.from({ length: 10 }, (v, i) => clipNames[i] ));
		grid.attach(dropDown, 4, 1, 2, 1);
		dropDown.set_selected(selected);
	});
	grid.attach(button, 4, 10, 2, 1);

	interval = setInterval(() => update(dropDown, input1Buffer, input2Buffer, grid, clip, clipNames, interval), 100);

    window.connect('close-request', 
	() => {
		clearInterval(interval);
	});

	group.add(grid);
	page.add(group);
	window.add(page);
}