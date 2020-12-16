import CommandLine from './CommandLine.js';
import ContextMenu from './ContextMenu.js';
import $           from './utils.js';

export default class Bookshelf
{
	constructor(options)
	{
		this.options = options;
		this.panels = [];
		this.currentPanelIndex = 0;

		this.$root = $.qS(this.options.selector);
		this.$tabs = $.qS(this.options.panelTabsSelector);

		CommandLine.registerCommand('panel', { commands: {
			add: {
				arguments: [
					{ name: 'title', required: true },
				],
				options: [
					{ short: 'b', long: 'cover', description: 'Cover filename', value: { required: true } },
					{ short: 'c', long: 'color', description: 'Accent color', value: { required: true } },
				],
				action: (opts, args) => {
					this.addPanel({ title: args.title, ...opts });
					this.togglePanel(this.panels.length - 1);
					return this.save();
				}
			},
			rm: {
				arguments: [
					{ name: 'title', required: false },
				],
				action: (opts, args) => {
					const index = args.title !== undefined
						? this.panels.findIndex(p => p.title === args.title)
						: this.currentPanelIndex;
					if (index < 0) {
						console.error(`No panel named ${args.title}`);
						return false;
					}
					this.panels.splice(index, 1);
					this.$root.removeChild(this.$root.children[index]);
					this.$tabs.removeChild(this.$tabs.lastElementChild);
					if (this.panels.length > 0)
						this.togglePanel(Math.min(index, this.panels.length - 1));
					return this.save();
				}
			},
			set: {
				arguments: [
					{ name: 'title', required: false },
				],
				options: [
					{ short: 'b', long: 'cover', description: 'Change the cover image of a panel', value: { required: true } },
					{ short: 'c', long: 'color', description: 'Change the accent color of a panel', value: { required: true } },
					{ short: 't', long: 'title', description: 'Rename a panel', value: { required: true } },
				],
				action: (opts, args) => {
					const index = args.title !== undefined
						? this.panels.findIndex(p => p.title === args.title)
						: this.currentPanelIndex;
					if (index < 0) {
						console.error(`No panel named ${args.title}`);
						return false;
					}

					const panel = this.panels[index];
					const $panel = this.$root.children[index];
					if (opts.title !== undefined) {
						panel.title = opts.title;
						$panel.querySelector('.cover').setAttribute('panel-title', opts.title);
					}
					if (opts.cover !== undefined) {
						panel.cover = opts.cover;
						$panel.querySelector('.cover').style.backgroundImage = `url("${opts.cover}")`;
					}
					if (opts.color !== undefined) {
						panel.color = opts.color;
						$panel.style.borderColor = opts.color;
					}
					return this.save();
				}
			}
		} });

		ContextMenu.registerMenu(this.$root, [
			{
				title: 'Add panel',
				icon: 'plus',
				action: (e) => { CommandLine.open('panel add '); }
			},
			{
				title: 'Toggle edit mode',
				icon: 'pen',
				action: (e) => { this.toggleEditMode(); }
			}
		]);

		this.load();
		this.bindEvents();
		this.togglePanel(0);
	}

	load()
	{
		const panelsData = JSON.parse(localStorage.bookshelf || '[]');
		for (const panel of panelsData)
			this.addPanel(panel);
		return true;
	}

	save()
	{
		localStorage.bookshelf = JSON.stringify(this.panels);
		return true;
	}

	addPanel(panelData)
	{
		const panel = { /*title,*/ color: '#fff', /*cover,*/ shelves: [], ...panelData };
		const $panel = $.createElement('.panel', this.$root, {
			style: {
				borderColor: panel.color
			}
		});

		ContextMenu.registerMenu($panel, [
			{
				title: 'Add shelf',
				icon: 'plus',
				action: (e) => {}
			},
			{
				title: 'Edit panel',
				icon: 'pen',
				action: (e) => { CommandLine.open('panel set '); }
			},
			{
				title: 'Remove panel',
				icon: 'trash',
				action: (e) => { CommandLine.open('panel rm '); }
			}
		]);

		if (panel.cover || panel.title) {
			const $cover = $.createElement(`.cover`, $panel);

			if (panel.cover)
				$cover.style.backgroundImage = `url("${panel.cover}")`;

			if (panel.title)
				$cover.setAttribute('panel-title', panel.title);
		}

		const $shelves = $.createElement('.shelves', $panel);
		for (const shelf of panel.shelves) {
			this.addShelf(shelf, $shelves);
		}

		const tab = $.createElement('span', this.$tabs);
		tab.addEventListener('click', (e) => {
			e.preventDefault();
			const index = Array.from(this.$tabs.children).indexOf(tab);
			this.togglePanel(index);
		});

		this.panels.push(panel);
	}

	addShelf(shelfData, $shelves)
	{
		const shelf = { /*title,*/ links: [], ...shelfData };
		const $shelf = $.createElement('.shelf', $shelves);

		ContextMenu.registerMenu($shelf, [
			{
				title: 'Add link',
				icon: 'plus',
				action: (e) => {}
			},
			{
				title: 'Edit shelf',
				icon: 'pen',
				action: (e) => { CommandLine.open('shelf set '); }
			},
			{
				title: 'Remove shelf',
				icon: 'trash',
				action: (e) => { CommandLine.open('shelf rm '); }
			}
		]);

		if (shelf.title)
			$.createElement(`h1{${shelf.title}}`, $shelf);

		for (const link of shelf.links) {
			this.addLink(link, $shelf);
		}
	}

	addLink(linkData, $shelf)
	{
		const link = { /*title,*/ href: '#', ...linkData };
		const $link = $.createElement(`a[href="${link.href}"]`, $shelf, {
			innerHTML: `<img src="chrome://favicon/${link.href}" /> ${link.title ?? ''}`
		});

		ContextMenu.registerMenu($link, [
			{
				title: 'Open link in new tab',
				icon: 'external-link-alt',
				action: (e) => { window.open(link.href, '_blank'); }
			},
			{
				title: 'Edit link',
				icon: 'pen',
				action: (e) => {}
			},
			{
				title: 'Remove link',
				icon: 'trash',
				action: (e) => {}
			}
		]);
	}

	toggleEditMode()
	{
		const createLinkEditor = ($fromLink = null) => {
			const $editor = $.createElement('span.link-editor');
			const $row = $.createElement('span', $editor);
			const $favicon = $.createElement('img', $row, { src: 'chrome://favicon/' + ($fromLink?.href ?? '') });
			const $titleInput = $.createElement('input.link-title', $row, { value: $fromLink?.innerText.trimStart() ?? '' });
			// const $gripIcon = $.createElement('i.fa.fa-grip-lines-vertical.grip', $row);
			const $hrefInput = $.createElement('input.link-href', $editor, { value: $fromLink?.href ?? '' });
			// Dynamic favicon preview
			$hrefInput.addEventListener('input', (e) => {
				$favicon.src = 'chrome://favicon/' + $hrefInput.value;
			});
			return $editor;
		};

		// Create a <button> to add link editors and bind their click events
		const createLinkAdder = ($parent) => {
			const $linkAdder = $.createElement('button.add{+}', $parent);
			$linkAdder.addEventListener('click', (e) => {
				const $editor = createLinkEditor();
				$parent.insertBefore($editor, $linkAdder);
				e.preventDefault();
			});
			return $linkAdder;
		};

		// For each panels...
		for (const $panel of Array.from(this.$root.children)) {
			const $shelves = $panel.querySelector('.shelves');

			// For each shelves...
			$shelves.querySelectorAll('.shelf').forEach(($shelf) => {
				// Replace the title with an input (or create one if there's none)
				const $title = $shelf.querySelector('h1');
				const $titleInput = $.createElement('input.shelf-title', null, { value: $title?.innerText ?? '' });
				if ($title !== null)
					$shelf.replaceChild($titleInput, $title);
				else
					$shelf.prepend($titleInput);

				// For each links...
				$shelf.querySelectorAll('a').forEach(($link) => {
					// Create a box to edit a link
					const $editor = createLinkEditor($link);
					$shelf.replaceChild($editor, $link);
				});

				createLinkAdder($shelf);
			});
			const $shelfAdder = $.createElement('button.add{+}', $shelves);
			$shelfAdder.addEventListener('click', (e) => {
				e.preventDefault();
				const $newShelf = $.createElement('.shelf');
				const $titleInput = $.createElement('input.shelf-title', $newShelf);
				$titleInput.focus();

				createLinkAdder($newShelf);
				$shelves.insertBefore($newShelf, $shelfAdder);
			});
		}
	}

	togglePanel(index)
	{
		if (index >= this.$root.childElementCount) {
			console.warn(`Out of range panel index: ${index} >= ${this.$root.childElementCount}`);
			return;
		}

		const $activePanel = this.$root.querySelector('.panel.active');
		if ($activePanel)
			$activePanel.classList.remove('active');

		const $activeTab = this.$tabs.querySelector('.active');
		if ($activeTab)
			$activeTab.classList.remove('active');

		this.$root.children[index].classList.add('active');
		this.$tabs.children[index].classList.add('active');
		this.currentPanelIndex = index;
	}

	bindEvents()
	{
		this.$root.addEventListener('mousewheel', (e) => {
			if (e.deltaX === 0)
				return;
			e.preventDefault();

			const delta = e.deltaX < 0 ? -1 : 1;
			let nextPanelIndex = (this.currentPanelIndex + delta) % this.$root.childElementCount;
			while (nextPanelIndex < 0)
				nextPanelIndex += this.$root.childElementCount;
			this.togglePanel(nextPanelIndex);
		});
	}
}