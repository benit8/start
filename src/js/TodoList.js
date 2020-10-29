import strftime from 'strftime';

export default class TodoList
{
	constructor(options)
	{
		const $root = document.querySelector(options.selector);
		this.$addButton = $root.querySelector('.add-toggler');
		this.$addInput = $root.querySelector('.add-input');
		this.$taskList = $root.querySelector('.tasks');

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

		const $task = document.createElement('div');
		$task.classList.add('task');
		$task.classList.toggle('done', task.done);
		$task.innerHTML = `<button class="remove">&times;</button><p class="title">${task.title}</p><span class="added-at" time="${task.addedAt.getTime()}">${ strftime('%d %b, %H:%M', task.addedAt) }</span>`;
		this.$taskList.insertAdjacentElement('afterbegin', $task);

		this.bindTask($task);
	}

	/// Controls
	openAdd() {
		this.$addButton.classList.add('active');
		this.$addInput.classList.add('active');
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
		this.$addButton.onclick = (e) => {
			e.preventDefault();

			this.toggleAdd();
			this.$addInput.focus();
		};

		this.$addInput.onkeydown = (e) => {
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
		};

		/*
		this.$addInput.onblur = (e) => {
			this.closeAdd(false);
		};
		*/
	}

	bindTask($el)
	{
		$el.onclick = (e) => {
			$el.classList.toggle('done');
			this.save();
		};

		$el.querySelector('.remove').onclick = (e) => {
			$el.remove();
			this.save();
		};
	}
}