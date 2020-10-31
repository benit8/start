import * as Applets from './Applets';
import ContextMenu  from './ContextMenu';

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
				action: (e) => { e.preventDefault(); }
			}
		]);

		const applets = JSON.parse(localStorage.applets || '[]');
		for (const a of applets)
			this.initApplet(a);
	}

	initApplet(appletData)
	{
		if (!this.appletTypes.hasOwnProperty(appletData.type))
			console.error(`Invalid applet type "${appletData.type}"`);

		const applet = new (this.appletTypes[appletData.type])(this.$applets, appletData);
		this.applets.push(applet);

		ContextMenu.registerMenu(this.$applets.lastElementChild, [
			{
				title: 'Remove applet',
				icon: 'trash',
				action: (e) => { e.preventDefault(); }
			}
		]);
	}
}