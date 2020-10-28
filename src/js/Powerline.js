import strftime from 'strftime';

class DateTimeApplet
{
	constructor($parent, options) {
		this.$root = this.createDOMSelf($parent);
		this.options = { format: '%c', ...options };

		this.update();
		this.interval = setInterval(() => { this.update(); }, 999);
	}

	destructor() {
		clearInterval(this.interval);
	}

	createDOMSelf($parent) {
		const $self = document.createElement('div');
		$self.classList.add('applet');
		$parent.appendChild($self);
		return $self;
	}

	update() {
		this.$root.innerHTML = strftime(this.options.format);
	}
}

class WeatherApplet
{
	constructor($parent, options) {
		this.$root = this.createDOMSelf($parent);
		this.options = { appid: '', location: 'Paris', units: 'metric', ...options };

		this.fetchData();
	}

	createDOMSelf($parent) {
		const $self = document.createElement('div');
		$self.classList.add('applet');
		$parent.appendChild($self);
		return $self;
	}

	fetchData() {
		if (this.options.appid === '') {
			this.handleError('No AppID');
			return;
		}

		const url = `https://api.openweathermap.org/data/2.5/weather?q=${this.options.location}&units=${this.options.units}&appid=${this.options.appid}`;
		fetch(url)
			.then((res) => res.json())
			.then((weatherData) => {
				const temperature = Math.round(weatherData.main.temp);
				const iconUrl = `http://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png`;
				const desc = weatherData.weather[0].description;
				this.$root.insertAdjacentHTML('afterbegin', `${temperature}°C<img src="${iconUrl}" alt="${desc}"/>`);
			})
			.catch((err) => {
				this.$root.insertAdjacentHTML('afterbegin', `<i>${err}</i>`);
				console.error(err);
			})
	}
}

class IpAddressApplet
{
	constructor($parent, options) {
		this.$root = this.createDOMSelf($parent);
		this.options = { token: '', ...options };

		this.fetchData();
	}

	createDOMSelf($parent) {
		const $self = document.createElement('div');
		$self.classList.add('applet');
		$parent.appendChild($self);
		return $self;
	}

	fetchData() {
		if (this.options.token === '') {
			this.handleError('No API token');
			return;
		}

		const url = `https://ipinfo.io/?token=${this.options.token}`;
		fetch(url)
			.then((res) => res.json())
			.then((data) => {
				const flag = data.country.toUpperCase().replace(/./g, c => String.fromCodePoint(c.charCodeAt(0) + 127397));
				this.$root.insertAdjacentHTML('afterbegin', `${flag} ${data.ip}`);
			})
			.catch((err) => {
				this.$root.insertAdjacentHTML('afterbegin', `<i>${err}</i>`);
				console.error(err);
			})
	}
}

export default class Powerline
{
	constructor(options)
	{
		this.appletTypes = {
			dateTime: DateTimeApplet,
			ipAddress: IpAddressApplet,
			weather: WeatherApplet,
		};
		this.applets = [];

		const $root = document.querySelector(options.selector);
		this.$applets = $root.querySelector('#applets');
		this.$tabs    = $root.querySelector('#tabs');

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