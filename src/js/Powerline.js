import * as Applets from './Applets';

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

		const $root = document.querySelector(options.selector);
		this.$applets = $root.querySelector('.applets');
		this.$tabs    = $root.querySelector('.panel-tabs');

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
	}
}