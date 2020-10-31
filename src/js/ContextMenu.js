import $ from './utils';

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
		e.preventDefault();

		// Check if a context menu is already open
		const $existingOverlay = $.qS('#context-menu-overlay');
		if ($existingOverlay !== null) {
			$existingOverlay.remove();
			return;
		}

		// Create a DOM element representing a context menu, with initial settings and position
		const createMenu = (settings, pos) => {
			const $overlay = $.createElement('#context-menu-overlay', document.body);
			$overlay.addEventListener('click', (e) => $overlay.remove());

			const $menu = $.createElement('#context-menu', $overlay);
			appendToMenu($menu, settings);
			return $menu;
		};

		// Add a separated sub-menu to an existing context menu
		const appendToMenu = ($menu, settings) => {
			if ($menu.childElementCount > 0) {
				$.createElement('hr', $menu);
			}

			const $list = $.createElement('ul', $menu);

			for (const action of settings) {
				const $listItem = $.createElement('li', $list);

				if (action.hasOwnProperty('icon'))
					$listItem.appendChild($.icon(action.icon));

				$.createElement(`a{${action.title}}`, $listItem, { onclick: action.action });
			}
		};

		let $contextMenu = null;

		// Going through the path of elements and appending mathing one's menus
		for (const $el of e.path) {
			const contextSettings = ContextMenu.elementsContext.get($el);
			if (contextSettings === undefined)
				continue;

			// One element matched
			if ($contextMenu === null)
				$contextMenu = createMenu(contextSettings);
			else
				appendToMenu($contextMenu, contextSettings);
		}

		// No context menu could be created for the targeted element(s)
		if ($contextMenu === null)
			return;

		let posX = e.x, posY = e.y;
		if (posX > window.innerWidth - $contextMenu.clientWidth)
			posX -= $contextMenu.clientWidth;
		if (posY > window.innerHeight - $contextMenu.clientHeight)
			posY -= $contextMenu.clientHeight;

		$contextMenu.style.left = `${posX}px`;
		$contextMenu.style.top = `${posY}px`;
	}
}