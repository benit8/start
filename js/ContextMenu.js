import $ from './utils.js';

export default class ContextMenu
{
	static elementsContext = new Map();

	static registerMenu($element, contextSettings)
	{
		if (ContextMenu.elementsContext.has($element))
			contextSettings = ContextMenu.elementsContext.get($element).concat(contextSettings);
		ContextMenu.elementsContext.set($element, contextSettings);
	}

	static initialize()
	{
		document.addEventListener('contextmenu', ContextMenu.handleContextMenuEvent);
	}

	static handleContextMenuEvent(e)
	{
		// Check if a context menu is already open
		const $existingOverlay = $.qS('#context-menu-overlay');
		if ($existingOverlay !== null) {
			$existingOverlay.remove();
			return;
		}

		// Create a DOM element representing a context menu, with initial settings and position
		const createMenu = (settings) => {
			const $overlay = $.createElement('#context-menu-overlay', document.body);
			$overlay.addEventListener('click', (e) => $overlay.remove());

			return $.createElement('#context-menu', $overlay);
		};

		// Add a separated sub-menu to an existing context menu
		const appendToMenu = ($menu, settings, $target) => {
			if ($menu.childElementCount > 0) {
				$.createElement('hr', $menu);
			}

			const $list = $.createElement('ul', $menu);

			for (const action of settings) {
				const $listItem = $.createElement('li', $list, {
					onclick: (e) => {
						e.preventDefault();
						action.action(e, $target);
					}
				});

				if (action.hasOwnProperty('icon'))
					$listItem.appendChild($.icon(action.icon));

				$.createElement(`a{${action.title}}`, $listItem);
			}
		};

		let $contextMenu = null;

		// Going through the path of elements and appending mathing one's menus
		const path = e.path || (e.composedPath && e.composedPath());
		for (const $el of path) {
			const contextSettings = ContextMenu.elementsContext.get($el);
			if (contextSettings === undefined)
				continue;

			// One element matched
			if ($contextMenu === null)
				$contextMenu = createMenu(contextSettings);

			appendToMenu($contextMenu, contextSettings, $el);
		}

		// No context menu could be created for the targeted element(s)
		if ($contextMenu === null)
			return;

		e.preventDefault();

		let posX = e.x, posY = e.y;
		if (posX > window.innerWidth - $contextMenu.clientWidth)
			posX -= $contextMenu.clientWidth;
		if (posY > window.innerHeight - $contextMenu.clientHeight)
			posY -= $contextMenu.clientHeight;

		$contextMenu.style.left = `${posX}px`;
		$contextMenu.style.top = `${posY}px`;
	}
}