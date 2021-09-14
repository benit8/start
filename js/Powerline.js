import * as Applets from './Applets.js';
import CommandLine  from './CommandLine.js';
import ContextMenu  from './ContextMenu.js';

export default class Powerline
{
	constructor(options)
	{
		this.appletTypes = {
			dateTime:  Applets.DateTime,
			ipAddress: Applets.IpAddress,
			weather:   Applets.Weather,
		};
		this.applets = [];

		this.$root = document.querySelector(options.selector);
		this.$applets = this.$root.querySelector('.applets');
		this.$tabs    = this.$root.querySelector('.panel-tabs');

		ContextMenu.registerMenu(this.$root, [
			{
				title: 'Add applet',
				icon: 'plus',
				action: (e) => {}
			}
		]);

		CommandLine.registerCommand('applet', {
			commands: {
				add: {
					commands: {
						datetime: {
							arguments: [
								{ name: 'format', required: true },
							],
							action: (opts, args) => {
								this.addApplet({ type: 'dateTime', ...args });
								this.save();
							}
						},
						ip: {
							arguments: [
								{ name: 'token', required: true },
							],
							options: [
								{ short: 'b', long: 'blur', description: 'Blur your IP address. Useful when streaming your desktop.' },
							],
							action: (opts, args) => {
								this.addApplet({ type: 'ipAddress', isBlurred: opts.blur, ...args });
								this.save();
							}
						},
						weather: {
							arguments: [
								{ name: 'appid', required: true },
								{ name: 'location', required: true },
							],
							options: [
								{ long: 'units', description: 'Unit in which to display the temperatures.', value: { required: true } }
							],
							action: (opts, args) => {
								this.addApplet({ type: 'weather', units: opts.units ?? 'metric', ...args });
								this.save();
							}
						},
					}
				}
			}
		});

		this.load();
	}

	load()
	{
		const applets = JSON.parse(localStorage.applets || '[]');
		for (const a of applets)
			this.initApplet(a);
	}

	save()
	{
		localStorage.applets = JSON.stringify(this.applets);
	}

	initApplet(appletData)
	{
		if (!this.appletTypes.hasOwnProperty(appletData.type))
			console.error(`Invalid applet type "${appletData.type}"`);

		this.addApplet(appletData);

		ContextMenu.registerMenu(this.$applets.lastElementChild, [
			{
				title: 'Remove applet',
				icon: 'trash',
				action: (e, $target) => {
					const index = Array.from(this.$applets.children).indexOf($target);
					this.applets.splice(index, 1); // Remove from member data
					$target.remove(); // Remove from DOM
					this.save();
				}
			}
		]);
	}

	addApplet(appletData)
	{
		const applet = new (this.appletTypes[appletData.type])(this, this.$applets, appletData);
		this.applets.push(applet);
		return applet;
	}
}