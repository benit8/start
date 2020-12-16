/*
 * User defined commands
 */

const search = {
	aliases: ['s'],
	arguments: [
		{ name: 'terms', required: true, variadic: true },
	],
	options: [
		{ short: 'n', description: 'Search in new tabs and keep the startpage open' },
		{ short: 'g', description: 'Search Google' },
		{ short: 'i', description: 'Search Google images' },
		{ short: 'y', description: 'Search YouTube' },
		{ short: 'j', description: 'Search Jisho' },
	],
	action: (opts, args) => {
		const engineUrls = {
			g: 'https://www.google.com/search?q=',
			i: 'https://www.google.com/search?tbm=isch&q=',
			y: 'https://www.youtube.com/results?search_query=',
			j: 'https://jisho.org/search/',
		};

		// Options don't take values here so let's just grab the object keys.
		const engines = Object.keys(opts).filter(k => k !== 'n');

		// Default search engine
		if (engines.length === 0)
			engines.push('g');

		// If we use multiple search engines, open new tabs for each engine, except the first
		// which will replace the startpage (unless the -n option is given)
		const termsUri = encodeURI(args.terms.join(' '));
		for (const [i, key] of engines.entries())
			if (opts.n || i > 0)
				window.open(engineUrls[key] + termsUri, '_blank');
		if (!opts.n && engines.length > 0)
			window.open(engineUrls[engines[0]] + termsUri, '_self');

		return true;
	}
};


export {
	search
};