import ContextMenu from './ContextMenu';
import $           from './utils';

export default class Bookshelf
{
	constructor(options)
	{
		this.options = options;
		this.currentPanelIndex = 0;

		this.$root = $.qS(options.selector);
		this.$tabs = $.qS(options.panelTabsSelector);

		ContextMenu.registerMenu(this.$root, [
			{
				title: 'Add panel',
				icon: 'plus',
				action: (e) => { e.preventDefault(); }
			}
		]);

		this.load();
		this.bindEvents();
		this.togglePanel(0);
	}

	load()
	{
		const panelsData = JSON.parse(localStorage.bookshelf || '[]');
		for (const panel of panelsData) {
			const $panel = $.createElement('.panel', this.$root, {
				style: {
					borderColor: panel.color
				}
			});

			ContextMenu.registerMenu($panel, [
				{
					title: 'Add shelf',
					icon: 'plus',
					action: (e) => { e.preventDefault(); }
				},
				{
					title: 'Edit panel',
					icon: 'pen',
					action: (e) => { e.preventDefault(); }
				},
				{
					title: 'Remove panel',
					icon: 'trash',
					action: (e) => { e.preventDefault(); }
				}
			]);

			const $cover = $.createElement(`.cover[panel-name="${panel.name}"]`, $panel, {
				style: {
					backgroundImage: `url("${panel.cover}")`
				}
			});

			const $shelves = $.createElement('.shelves', $panel);
			for (const shelf of panel.shelves) {
				const $shelf = $.createElement('.shelf', $shelves);

				ContextMenu.registerMenu($shelf, [
					{
						title: 'Add link',
						icon: 'plus',
						action: (e) => { e.preventDefault(); }
					},
					{
						title: 'Edit shelf',
						icon: 'pen',
						action: (e) => { e.preventDefault(); }
					},
					{
						title: 'Remove shelf',
						icon: 'trash',
						action: (e) => { e.preventDefault(); }
					}
				]);

				if (shelf.title)
					$.createElement(`h1{${shelf.title}}`, $shelf);

				for (const link of shelf.links) {
					const $link = $.createElement(`a[href="${link.href}"]`, $shelf, { innerText: link.title });

					ContextMenu.registerMenu($link, [
						{
							title: 'Edit link',
							icon: 'pen',
							action: (e) => { e.preventDefault(); }
						},
						{
							title: 'Remove link',
							icon: 'trash',
							action: (e) => { e.preventDefault(); }
						}
					]);
				}
			}

			$.createElement('span', this.$tabs);
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
		this.$root.onmousewheel = (e) => {
			if (e.deltaX !== 0) {
				e.preventDefault();

				const delta = e.deltaX < 0 ? -1 : 1;
				let nextPanelIndex = (this.currentPanelIndex + delta) % this.$root.childElementCount;
				while (nextPanelIndex < 0)
					nextPanelIndex += this.$root.childElementCount;
				this.togglePanel(nextPanelIndex);
			}
		};

		for (const tab of this.$tabs.children) {
			tab.onclick = (e) => {
				e.preventDefault();
				const index = Array.prototype.indexOf.call(this.$tabs.children, tab);
				this.togglePanel(index);
			};
		}
	}
}