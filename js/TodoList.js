import CommandLine from './CommandLine.js';
import ContextMenu from './ContextMenu.js';
import $           from './utils.js';

export default class TodoList
{
	constructor(options)
	{
		this.tasks = [];
		this.$root = document.querySelector(options.selector);
		this.$addButton = this.$root.querySelector('.add-toggler');
		this.$addInput = this.$root.querySelector('.add-input');
		this.$taskList = this.$root.querySelector('.tasks');

		CommandLine.registerCommand('todo', { commands: {
			add: {
				arguments: [
					{ name: 'title', required: true },
				],
				action: (opts, args) => {
					this.addTask({ title: args.title });
					this.save();
					return true;
				}
			},
			edit: {
				arguments: [
					{ name: 'id', required: true },
					{ name: 'title', required: true },
				],
				action: (opts, args) => {
					const id = parseInt(args.id);
					// this.tasks[id].title = args.title;
					this.$taskList.children[id].querySelector('.title').innerHTML = args.title;
					this.save();
					return true;
				}
			},
			done: {
				arguments: [
					{ name: 'id', required: true },
				],
				action: (opts, args) => {
					const id = parseInt(args.id);
					// this.tasks[id].done = !this.tasks[id].done;
					const classList = this.$taskList.children[id].classList;
					classList.toggle('done', !classList.contains('done'));
					this.save();
					return true;
				}
			},
			remove: {
				arguments: [
					{ name: 'id', required: true },
				],
				action: (opts, args) => {
					const id = parseInt(args.id);
					this.tasks.splice(id, 1);
					this.$taskList.children[id].remove();
					this.save();
					return true;
				}
			}
		} });

		ContextMenu.registerMenu(this.$root, [
			{
				title: 'Add task',
				icon: 'plus',
				action: (e) => {
					this.openAddInput();
					this.$addInput.focus();
				}
			},
			{
				title: 'Clear tasks',
				icon: 'trash',
				action: (e) => {
					this.$tasks.innerHTML = '';
					this.save();
				}
			}
		]);

		this.loadTasks();
		this.bindEvents();
	}

	/// Saving & loading
	loadTasks()
	{
		const tasksJson = localStorage.tasks || '[]';
		const tasks = JSON.parse(tasksJson);

		for (const t of tasks)
			this.addTask(t);
	}

	save()
	{
		const tasks = [];
		const $tasks = this.$taskList.children;

		for (let i = $tasks.length; i--; ) {
			const $t = $tasks[i];
			tasks.push({
				title: $t.querySelector('.title').innerHTML,
				addedAt: parseInt($t.querySelector('.added-at').getAttribute('time')),
				done: $t.classList.contains('done')
			});
		}

		localStorage.tasks = JSON.stringify(tasks);
	}

	/// Tasks
	addTask(task)
	{
		task.addedAt ??= new Date;
		task.done    ??= false;

		if (typeof task.addedAt !== 'object')
			task.addedAt = new Date(task.addedAt);

		const $task = $.createElement('.task');
		$task.classList.toggle('done', task.done);
		$task.innerHTML = `<button class="remove">&times;</button><p class="title">${task.title}</p><span class="added-at" time="${task.addedAt.getTime()}">${ strftime('%d %b, %H:%M', task.addedAt) }</span>`;
		this.$taskList.insertAdjacentElement('afterbegin', $task);

		ContextMenu.registerMenu($task, [
			{
				title: 'Edit task',
				icon: 'pen',
				action: (e, $target) => {
					const $title = $target.querySelector('.title');
					$.transformToTextarea($title, $title.innerHTML)
						.then((newContent) => {
							$title.innerHTML = newContent;
							this.save();
						})
					.catch(() => { /* pass */ })
				}
			},
			{
				title: 'Remove task',
				icon: 'trash',
				action: (e, $target) => {
					$target.remove();
					this.save();
				}
			}
		]);

		this.bindTask($task);
		this.tasks.push(task);
	}

	/// Controls
	openAddInput() {
		this.$addButton.classList.add('active');
		this.$addInput.classList.add('active');
		this.$addInput.focus();
	}

	closeAddInput(clearInputValue = true) {
		this.$addButton.classList.remove('active');
		this.$addInput.classList.remove('active');

		if (clearInputValue)
			this.$addInput.value = '';
	}

	toggleAddInput() {
		this.$addButton.classList.toggle('active');
		this.$addInput.classList.toggle('active');
	}

	/// DOM events bindings
	bindEvents()
	{
		this.$addButton.addEventListener('click', (e) => {
			e.preventDefault();
			this.toggleAddInput();
			this.$addInput.focus();
		});

		this.$addInput.addEventListener('keydown', (e) => {
			switch (e.keyCode) {
				case 13: // Return
					const task = e.target.value;
					if (task.length === 0)
						return;
					this.addTask({title: task});
					this.save();
					e.target.value = '';
					break;
				case 27: // Escape
					this.closeAddInput();
					break;
				default:
					break;
			}
		});

		/* this.$addInput.addEventListener('blur', (e) => {
			this.closeAddInput(false);
		}); */
	}

	bindTask($el)
	{
		$el.addEventListener('click', (e) => {
			// Special case for when editing a task
			if (e.target.tagName === 'TEXTAREA')
				return;

			$el.classList.toggle('done');
			this.save();
		});

		$el.querySelector('.remove').addEventListener('click', (e) => {
			$el.remove();
			this.save();
		});
	}
}