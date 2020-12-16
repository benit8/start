import $ from './utils.js';
import * as UserCommands from './commands/user.js';

export default class CommandLine
{
	static the;

	constructor(options)
	{
		CommandLine.the = this;

		this.options = options;
		this.$root = $.qS(this.options.selector);
		this.$input = this.$root.querySelector('.input > input + input');
		this.$autocomplete = this.$root.querySelector('.autocomplete');
		this.$suggestions = this.$root.querySelector('.suggestions');

		this.history = [];
		this.commands = { ...UserCommands };

		this.shortcuts = [
			{ key: 'p' },
			{ key: 's', value: 'search ' }
		];

		this.bindEvents();
	}

	static registerCommand(name, command)
	{
		if (CommandLine.the.commands.hasOwnProperty(name))
			return false;

		CommandLine.the.commands[name] = command;
		return true;
	}

	static open(initValue = '', selection = null) { CommandLine.the.open(initValue, selection); }
	open(initValue = '', selection = null)
	{
		this.$root.classList.add('active');
		this.$input.value = initValue;
		this.$autocomplete.value = initValue;

		this.$input.focus();
		if (selection !== null)
			this.$input.setSelectionRange(selection.start, selection.start + selection.length);

		// if (initValue.length > 0)
		// 	this.suggestCompletion();
	}

	static close() { CommandLine.the.close(); }
	close()
	{
		this.$root.classList.remove('active');
		this.$input.value = '';
		this.$autocomplete.value = '';
		this.$suggestions.innerHTML = '';

		// Unfocus the $input
		this.$input.blur();
	}

	isOpen()
	{
		return this.$root.classList.contains('active');
	}

	suggestCompletion()
	{
		console.log('---------------------------');
		const cursorPosition = this.$input.selectionDirection === 'forward' ? this.$input.selectionEnd : this.$input.selectionStart;
		const input = this.$input.value.substr(0, cursorPosition);
		const tokens = this.parseInputForTokens(input, true);
		const context = this.parseTokensForContext(tokens);
		console.log('context', context, tokens);

		// Only the end of the input shall be completed, thus if we couldn't
		// find a previous token as a command we do not try to complete
		if (tokens.length > 1)
			return;

		const token = tokens.shift();
		if (context?.commands !== null) {
			let possibilities = Object.keys(context.commands);
			if (token && token.length > 0)
				possibilities = possibilities.filter((c) => c.startsWith(token));
			possibilities.sort();
			console.log('possibilities', possibilities);
			if (!possibilities.length)
				return;

			// const firstSugg = possibilities.shift();
			// if (token)
			// 	this.$autocomplete.value = this.$autocomplete.value.replace(new RegExp(`${token}$`), firstSugg);
			// else
			// 	this.$autocomplete.value = this.$autocomplete.value.trimEnd() + ' ' + firstSugg;

			for (const p of possibilities) {
				let possibleCmd;
				if (token) // Trying to complete a word
					possibleCmd = this.$autocomplete.value.replace(new RegExp(token + '$'), p);
				else
					possibleCmd = this.$autocomplete.value.trimEnd() + ' ' + p;
				const $li = $.createElement(`li{${possibleCmd}}`, this.$suggestions);
			}
		}
		else if (context.hasOwnProperty('arguments')) {
			this.$autocomplete.value = input.trimEnd();
			for (const arg of context.arguments) {
				let name = arg.name;
				if (arg?.variadic)
					name += '...';
				if (arg?.required)
					this.$autocomplete.value += ` <${name}>`;
				else
					this.$autocomplete.value += ` [${name}]`;
			}
		}
	}

	executeCommand()
	{
		const input = this.$input.value;
		const tokens = this.parseInputForTokens(input);
		console.log('tokens', tokens);

		const context = this.parseTokensForContext(tokens);
		if (context === null) {
			console.error(`Unknown command "${tokens[0]}"`);
			return false;
		}
		console.log('context', context, tokens);

		const res = this.parseOptionsAndArguments(context, tokens);
		if (res === null) {
			console.error('Failed to parse options & arguments');
			return false;
		}

		if (context.action === undefined) {
			console.error('No action callback is defined in this command context');
			return false;
		}

		const success = context.action(res.opts, res.args);
		this.history.push(input);

		if (success)
			this.close();
		else {
			// FIXME: implement an error feedback system
		}

		return true;
	}

	parseInputForTokens(input, insertNullIfTrailingSpaces = false)
	{
		// input = input.trimEnd();
		const tokens = [];
		for (let i = 0; i < input.length; ) {
			// Skip whitespaces
			while (i < input.length && input[i].match(/\s/))
				i++;

			if (input[i] === `"` || input[i] === `'`) {
				const quoteChar = input[i];
				const start = ++i;
				while (i < input.length && input[i] !== quoteChar) {
					if (input[i] === '\\')
						i++;
					i++;
				}
				if (i >= input.length)
					break;
				tokens.push(input.substr(start, i - start));
				i++; // Skip closing quote
			}
			else {
				const start = i;
				while (i < input.length && !input[i].match(/\s/))
					i++;
				if (i > start)
					tokens.push(input.substr(start, i - start));
			}
		}
		return tokens;
	}

	parseTokensForContext(tokens, rootContext = this)
	{
		// Pop the tokens array from the front while we find a corresponding command context
		let context = rootContext;

		while (tokens.length > 0) {
			const token = tokens[0];
			/// FIXME: make this one condition when the implementation will be fully done
			// Does the context have subcommands?
			if (!context.hasOwnProperty('commands')) {
				console.warn('no commands property in:', context);
				break;
			}
			// Can we find a subcommands like the current token
			if (!context.commands.hasOwnProperty(token)) {
				console.warn('no command named ' + token + ' in:', context.commands);
				break;
			}

			context = context.commands[tokens.shift()];
		}

		// Can't have the root context being a command context
		return context !== rootContext ? context : null;
	}

	parseOptionsAndArguments(context, tokens)
	{
		// FIXME: trim a last 'null' in tokens
		// TODO: validate the context arguments

		// Sketch out the resulting object
		const opts = {}, args = {};

		let tokenIndex = 0;
		const consumeToken = () => {
			return tokens[tokenIndex++];
		};

		const consumeOption = (token, isLong) => {
			const optionRegexes = [
				/^-(\w)(.+)?$/,
				/^--(\w+)(?:=(.*))?$/
			];
			const matches = token.match(optionRegexes[Number(isLong)]);
			if (matches === null) {
				console.error('Option regex failed');
				return false;
			}

			const optionName = matches[1];
			const option = context.options.find(isLong
				? (opt => opt.long && opt.long === optionName)
				: (opt => opt.short && opt.short === optionName));
			if (option === undefined) {
				console.error(`No option '${optionName}'`);
				return false;
			}

			// Does the option accept a value? (required or optional)
			if (option?.value) {
				// Try to use the matched '--option=value' form
				let value = matches[2];
				// If the value is required we still have no value
				if (option.value?.required && !value) {
					// Try to consume the next token
					value = consumeToken();
					// Still no value? Aight gotta go...
					if (!value) {
						console.error(`Option '${optionName}' requires a value`);
						return false;
					}
				}
				// FIXME: accept() value
				opts[option.long ?? option.short] = value;
			}
			else {
				// Watch for a value when we didn't ask for one
				if (matches[2] !== undefined) {
					// Recurse on the -abc form, when no argument is required
					if (!isLong) {
						opts[option.long ?? option.short] = true;
						return consumeOption('-' + matches[2], false);
					}
					else {
						console.error(`Option '${optionName}' doesn't accept any value`);
						return false;
					}
				}
				opts[option.long ?? option.short] = true;
			}
			return true;
		};

		// Walk through the argument list and assign them as we do
		let argumentIndex = 0;
		const consumeArgument = (token) => {
			if (argumentIndex >= context.arguments.length) {
				console.error('Too much arguments provided');
				return false;
			}
			const arg = context.arguments[argumentIndex];
			if (arg.variadic) {
				if (args[arg.name] === undefined)
					args[arg.name] = [token];
				else
					args[arg.name].push(token);
			}
			else {
				args[arg.name] = token;
				argumentIndex++;
			}
			return true;
		};

		while (tokenIndex < tokens.length) {
			const token = consumeToken();
			if (token.startsWith('--')) {
				if (context.options === undefined || !consumeOption(token, true))
					return null;
			}
			else if (token.startsWith('-')) {
				if (context.options === undefined || !consumeOption(token, false))
					return null;
			}
			else {
				if (context.arguments === undefined || !consumeArgument(token))
					return null;
			}
		}

		// Finish iterating the arguments
		if (argumentIndex < context.arguments?.length) {
			const nextArg = context.arguments[argumentIndex];
			// FIXME: make the search command work
			if ((nextArg?.variadic && args[nextArg.name] === undefined) || (nextArg?.required && !nextArg?.variadic)) {
				console.error('Too few arguments provided');
				return null;
			}
		}

		return { opts, args };
	}

	bindEvents()
	{
		document.body.addEventListener('keydown', (e) => {
			// Don't execute when typing text
			if (['INPUT', 'TEXTAREA'].includes(e.target.tagName))
				return;

			if (this.isOpen())
				return;

			for (const shortcut of this.shortcuts) {
				if (e.key === shortcut.key) {
					console.log('Caught a keybind', e);
					e.preventDefault();
					this.open(shortcut.value ?? '');
					break;
				}
			}
		});

		this.$input.addEventListener('keydown', (e) => {
			if (e.key === 'Escape')
				this.close();
			else if (e.key === 'Enter')
				this.executeCommand();
			else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
				// TODO: Cycle through history or suggestions
			}
			else if (e.key === 'Tab') {
				e.preventDefault();
				// this.$input.value = this.$autocomplete.value + ' ';
				this.suggestCompletion();
			}
		});

		this.$input.addEventListener('input', (e) => {
			this.history[this.history.length] = this.$input.value;
			// this.$suggestions.innerHTML = '';
			// this.$autocomplete.value = this.$input.value;
			// this.suggestCompletion();
		});
	}
}