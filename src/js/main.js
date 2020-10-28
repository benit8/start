import Bookshelf from './Bookshelf'
import Powerline from './Powerline'
import TodoList from './TodoList'


const pl = new Powerline({
	selector: '#powerline'
});


const bs = new Bookshelf({
	selector: '#bookshelf',
	panelTabsSelector: '#powerline #tabs'
});


const tl = new TodoList({
	selector: '#todo-list'
});