const $ = {
	qS: e => document.querySelector(e),
	qA: e => document.querySelectorAll(e),

	createElement: (selector, $parent = null, props = {}, children = []) => {
		const parts = selector.match(/^([a-z0-9]+)?(#[a-z][a-z0-9-]*)?((?:\.[a-z][a-z0-9-]*)*)((?:\[[a-z][a-z0-9-]*(?:=['"]?[^\]]+['"]?)?\])*)(\{[^\}]+\})?$/i);
		if (!parts) {
			console.error(`Invalid selector syntax: '${selector}'`);
			return null;
		}

		const tag        = parts[1];
		const id         = parts[2];
		const classes    = parts[3];
		const attributes = parts[4];
		const innerText  = parts[5];

		const $el = document.createElement(tag ?? 'div');

		if ($parent)
			$parent.appendChild($el);

		if (id)
			$el.id = id.substr(1);

		if (classes) {
			const classNames = classes.substr(1).split('.');
			for (const c of classNames)
				$el.classList.add(c);
		}

		if (attributes) {
			let match;
			const regex = /\[([a-z][a-z-]+)(?:=['"]?([^\]'"]*)['"]?)?\]*/ig;
			while ((match = regex.exec(attributes)) !== null) {
				$el.setAttribute(match[1], match[2] ?? '');
			}
		}

		if (innerText)
			$el.innerText = innerText.substr(1, innerText.length - 2);

		$.merge($el, props);

		for (const c of children)
			$.createElement(c.tag, $el, c.props, c.children);

		return $el;
	},

	icon: (name, style = 'fa') => {
		return $.createElement(`i.${style}.fa-${name}`);
	},

	merge: (dest, ...args) => {
		const isObject = (o) => o && typeof o === 'object' && !Array.isArray(o);

		if (args.length === 0)
			return dest;

		const arg = args.shift();
		if (isObject(dest) && isObject(arg)) {
			for (const key in arg) {
				if (!isObject(arg[key]))
					Object.assign(dest, { [key]: arg[key] });
				else {
					if (!dest[key])
						Object.assign(dest, { [key]: {} });
					$.merge(dest[key], arg[key]);
				}
			}
		}

		return $.merge(dest, ...args);
	}
};

export default $;