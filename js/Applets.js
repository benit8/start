import ContextMenu from './ContextMenu.js';
import $           from './utils.js';

///////////////////////////////////////////////////////////////////////////////

class Applet
{
	constructor(powerline, $parent, options)
	{
		this.powerline = powerline;
		this.$parent = $parent;
		this.options = options;
		this.$root = this.createDOMSelf();
	}

	createDOMSelf()
	{
		return $.createElement('.applet', this.$parent);
	}

	save()
	{
		this.powerline.save();
	}

	// Puts an <input /> in the place of the content.
	// When Enter is pressed, the value gets resolved.
	// When Escape is pressed, the value gets rejected.
	transformToInput(value = '')
	{
		return new Promise((resolve, reject) => {
			const savedHTML = this.$root.innerHTML;
			this.$root.innerHTML = '';

			const restore = (decision, ...decisionParams) => {
				$input.remove();
				this.$root.innerHTML = savedHTML;
				decision(...decisionParams);
			};

			const $input = $.createElement('input', this.$root, { spellcheck: false, value: value });
			$input.focus();
			$input.setSelectionRange(0, value.length);
			$input.addEventListener('keydown', (e) => {
				if (e.key === 'Escape')
					restore(reject);
				else if (e.key === 'Enter')
					restore(resolve, $input.value);
			});
		});
	}

	toJSON()
	{
		return this.options;
	}
}

///////////////////////////////////////////////////////////////////////////////

class DateTime extends Applet
{
	constructor(powerline, $parent, options)
	{
		super(powerline, $parent, { format: '%c', ...options });
		this.paused = false;

		ContextMenu.registerMenu(this.$root, [
			{
				title: 'Edit format',
				icon: 'clock',
				action: (e) => {
					this.paused = true;
					this.transformToInput(this.options.format)
						.then((newFormat) => {
							this.options.format = newFormat;
							this.save();
						})
						.catch(() => { /* pass */ })
						.finally(() => {
							this.paused = false;
						})
				}
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
		if (this.paused)
			return;
		this.$root.innerHTML = strftime(this.options.format);
	}
}

///////////////////////////////////////////////////////////////////////////////

class IpAddress extends Applet
{
	constructor(powerline, $parent, options)
	{
		super(powerline, $parent, { token: '', isBlurred: false, ...options });

		ContextMenu.registerMenu(this.$root, [
			{
				title: 'Edit API key',
				icon: 'key',
				action: (e) => {
					this.transformToInput(this.options.token)
						.then((newToken) => {
							this.options.token = newToken;
							this.save();
							this.fetchData();
						})
						.catch(() => { /* pass */ })
				}
			},
			{
				title: 'Toggle blur',
				icon: 'eye-slash',
				action: (e) => {
					this.options.isBlurred = !this.options.isBlurred;
					this.update();
					this.save();
				}
			}
		]);

		this.update();
		this.fetchData();
	}

	update()
	{
		this.$root.style.filter = this.options.isBlurred ? 'blur(4px)' : '';
	}

	fetchData()
	{
		if (this.options.token === '') {
			console.error('Applets: IpAddress: No API token');
			return;
		}

		const url = `https://ipinfo.io/?token=${this.options.token}`;
		fetch(url)
			.then((res) => res.json())
			.then((data) => {
				const flag = data.country.toUpperCase().replace(/./g, c => String.fromCodePoint(c.charCodeAt(0) + 127397));
				this.$root.innerHTML = `${flag} ${data.ip}`;
			})
			.catch((err) => {
				this.$root.innerHTML = `<i>${err}</i>`;
				console.error(err);
			})
	}
}

///////////////////////////////////////////////////////////////////////////////

class Weather extends Applet
{
	constructor(powerline, $parent, options)
	{
		super(powerline, $parent, { appid: '', location: 'Paris', units: 'metric', ...options });

		ContextMenu.registerMenu(this.$root, [
			{
				title: 'Edit location',
				icon: 'compass',
				action: (e) => {
					this.transformToInput(this.options.location)
						.then((newLocation) => {
							this.options.location = newLocation;
							this.save();
							this.fetchData();
						})
						.catch(() => { /* pass */ })
				}
			},
			{
				title: 'Edit API key',
				icon: 'key',
				action: (e) => {
					this.transformToInput(this.options.appid)
						.then((newAppid) => {
							this.options.appid = newAppid;
							this.save();
							this.fetchData();
						})
						.catch(() => { /* pass */ })
				}
			}
		]);

		this.fetchData();
	}

	fetchData()
	{
		if (this.options.appid === '') {
			console.error('Applets: Weather: No AppID');
			return;
		}

		const url = `https://api.openweathermap.org/data/2.5/weather?q=${this.options.location}&units=${this.options.units}&appid=${this.options.appid}`;
		fetch(url)
			.then((res) => res.json())
			.then((weatherData) => {
				const temperature = Math.round(weatherData.main.temp);
				const iconUrl = `http://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png`;
				const desc = weatherData.weather[0].description;
				this.$root.innerHTML = `${temperature}°C<img src="${iconUrl}" alt="${desc}"/>`;
			})
			.catch((err) => {
				this.$root.innerHTML = `<i>${err}</i>`;
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