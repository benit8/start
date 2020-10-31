import ContextMenu from './ContextMenu';
import $           from './utils';
import strftime    from 'strftime';

///////////////////////////////////////////////////////////////////////////////

class Applet
{
	constructor($parent)
	{
		this.$parent = $parent;
	}

	createDOMSelf($parent)
	{
		return $.createElement('.applet', this.$parent);
	}
}

///////////////////////////////////////////////////////////////////////////////

class DateTime extends Applet
{
	constructor($parent, options)
	{
		super($parent);

		this.$root = this.createDOMSelf();
		this.options = { format: '%c', ...options };

		ContextMenu.registerMenu(this.$root, [
			{
				title: 'Edit format',
				icon: 'clock',
				action: (e) => { e.preventDefault(); }
			}
		]);

		this.update();
		this.interval = setInterval(() => { this.update(); }, 999);
	}

	destructor()
	{
		clearInterval(this.interval);
	}

	update()
	{
		this.$root.innerHTML = strftime(this.options.format);
	}
}

///////////////////////////////////////////////////////////////////////////////

class IpAddress extends Applet
{
	constructor($parent, options)
	{
		super($parent);

		this.$root = this.createDOMSelf();
		this.options = { token: '', ...options };

		this.fetchData();
	}

	fetchData()
	{
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

///////////////////////////////////////////////////////////////////////////////

class Weather extends Applet
{
	constructor($parent, options)
	{
		super($parent);

		this.$root = this.createDOMSelf();
		this.options = { appid: '', location: 'Paris', units: 'metric', ...options };

		ContextMenu.registerMenu(this.$root, [
			{
				title: 'Edit location',
				icon: 'compass',
				action: (e) => { e.preventDefault(); }
			}
		]);

		this.fetchData();
	}

	fetchData()
	{
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

///////////////////////////////////////////////////////////////////////////////

export {
	DateTime,
	IpAddress,
	Weather
};