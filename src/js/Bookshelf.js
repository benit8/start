export default class Bookshelf
{
	constructor(options)
	{
		this.options = options;
		this.currentPanelIndex = 0;

		this.$root = document.querySelector(options.selector);
		this.$tabs = document.querySelector(options.panelTabsSelector);

		this.load();
		this.bindEvents();
		this.togglePanel(0);
	}

	load()
	{
		const panelsData = JSON.parse(localStorage.bookshelf || '[]');
		for (const panel of panelsData) {
			const $panel = document.createElement('div');
			this.$root.appendChild($panel);
			$panel.classList.add('panel');
			$panel.style.borderColor = panel.color;

			const $cover = document.createElement('div');
			$panel.appendChild($cover);
			$cover.classList.add('cover');
			$cover.setAttribute('panel-name', panel.name);
			$cover.style.backgroundImage = `url("${panel.cover}")`;

			const $shelves = document.createElement('div');
			$panel.appendChild($shelves);
			$shelves.classList.add('shelves');

			for (const shelf of panel.shelves) {
				const $shelf = document.createElement('div');
				$shelves.appendChild($shelf);
				$shelf.classList.add('shelf');

				if (shelf.title) {
					const $title = document.createElement('h1');
					$shelf.appendChild($title);
					$title.innerText = shelf.title;
				}

				for (const link of shelf.links) {
					const $link = document.createElement('a');
					$shelf.appendChild($link);
					$link.setAttribute('href', link.href);
					$link.innerText = link.title;
				}
			}

			const $tab = document.createElement('span');
			this.$tabs.appendChild($tab);
		}
	}

	togglePanel(index)
	{
		if (index >= this.$root.childElementCount) {
			console.warn(`Out of range panel index: ${index}/${this.$root.childElementCount}`);
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