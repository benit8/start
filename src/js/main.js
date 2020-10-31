import Bookshelf   from './Bookshelf';
import ContextMenu from './ContextMenu';
import Powerline   from './Powerline';
import TodoList    from './TodoList';


// Singleton pattern
ContextMenu.initialize();


const bs = new Bookshelf({
	selector: '#bookshelf',
	panelTabsSelector: '#powerline .panel-tabs'
});

const tl = new TodoList({
	selector: '#todo-list'
});

const pl = new Powerline({
	selector: '#powerline'
});