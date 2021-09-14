const $ = {
	qS: e => document.querySelector(e),
	qA: e => document.querySelectorAll(e),

	/**
	 * Quickly creates an Element
	 */
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

	/**
	 * Quickly creates an icon Element
	 */
	icon: (name, style = 'fa') => {
		return $.createElement(`i.${style}.fa-${name}`);
	},

	/**
	 * Merge two objects
	 */
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
	},

	/**
	 * Puts an <input /> in the place of the content.
	 * When Enter is pressed, the value gets resolved.
	 * When Escape is pressed, the value gets rejected.
	 */
	transformToTextarea: ($el, value = '') => {
		return new Promise((resolve, reject) => {
			// What will happen when the textarea's job is done.
			const restore = (decision, ...decisionParams) => {
				$el.classList.toggle('hidden');
				$input.remove();
				decision(...decisionParams);
			};

			$el.classList.toggle('hidden');

			const $input = $.createElement('textarea', null, { spellcheck: false, value: value });
			$input.addEventListener('keydown', (e) => {
				if (e.key === 'Escape')
					restore(reject);
				else if (e.key === 'Enter' && !e.shiftKey)
					restore(resolve, $input.value);
			});

			$el.after($input);
			$input.focus();
			$input.setSelectionRange(0, value.length);
		});
	}
};

export default $;