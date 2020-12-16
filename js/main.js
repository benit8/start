import Bookshelf   from './Bookshelf.js';
import CommandLine from './CommandLine.js';
import ContextMenu from './ContextMenu.js';
import Powerline   from './Powerline.js';
import TodoList    from './TodoList.js';


const cl = new CommandLine({
	selector: '#command'
});

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


// DEBUG
console.log(cl, bs, tl, pl);