import ContextMenu from './ContextMenu';
import $           from './utils';
import strftime    from 'strftime';

export default class TodoList
{
	constructor(options)
	{
		this.$root = document.querySelector(options.selector);
		this.$addButton = this.$root.querySelector('.add-toggler');
		this.$addInput = this.$root.querySelector('.add-input');
		this.$taskList = this.$root.querySelector('.tasks');

		ContextMenu.registerMenu(this.$root, [
			{
				title: 'Add task',
				icon: 'plus',
				action: (e) => { e.preventDefault(); this.toggleAdd(); }
			}
		]);

		this.load();
		this.bindEvents();
	}

	/// Saving & loading
	load()
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

		if (typeof task.addedAt === 'number')
			task.addedAt = new Date(task.addedAt);

		const $task = $.createElement('.task');
		$task.classList.toggle('done', task.done);
		$task.innerHTML = `<button class="remove">&times;</button><p class="title">${task.title}</p><span class="added-at" time="${task.addedAt.getTime()}">${ strftime('%d %b, %H:%M', task.addedAt) }</span>`;
		this.$taskList.insertAdjacentElement('afterbegin', $task);

		ContextMenu.registerMenu($task, [
			{
				title: 'Edit task',
				icon: 'pen',
				action: (e) => { e.preventDefault(); }
			},
			{
				title: 'Remove task',
				icon: 'trash',
				action: (e) => { e.preventDefault(); }
			}
		]);

		this.bindTask($task);
	}

	/// Controls
	openAdd() {
		this.$addButton.classList.add('active');
		this.$addInput.classList.add('active');
		this.$addInput.focus();
	}

	closeAdd(clearInputValue = true) {
		this.$addButton.classList.remove('active');
		this.$addInput.classList.remove('active');

		if (clearInputValue)
			this.$addInput.value = '';
	}

	toggleAdd() {
		this.$addButton.classList.toggle('active');
		this.$addInput.classList.toggle('active');
	}

	/// DOM events bindings
	bindEvents()
	{
		this.$addButton.addEventListener('click', (e) => {
			e.preventDefault();

			this.toggleAdd();
			this.$addInput.focus();
		});

		this.$addInput.addEventListener('keydown', (e) => {
			switch (e.keyCode) {
				case 13:
					const task = e.target.value;
					if (task.length === 0)
						return;
					this.addTask({title: task});
					this.save();
					e.target.value = '';
					break;
				case 27:
					this.closeAdd();
					break;
				default:
					break;
			}
		});

		/*
		this.$addInput.addEventListener('blur', (e) => {
			this.closeAdd(false);
		});
		*/
	}

	bindTask($el)
	{
		$el.addEventListener('click', (e) => {
			$el.classList.toggle('done');
			this.save();
		});

		$el.querySelector('.remove').addEventListener('click', (e) => {
			$el.remove();
			this.save();
		});
	}
}