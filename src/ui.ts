import { SiyuanApi } from "./api";
import { Task } from "./types";

export class TaskListUI {
    private container: HTMLElement;
    private api: SiyuanApi;
    private listElement: HTMLElement;

    constructor(container: HTMLElement, api: SiyuanApi) {
        this.container = container;
        this.api = api;
    }

    async render() {
        const tasks = await this.api.getTasks();
        this.container.innerHTML = `
            <div class="task-list">
            </div>
        `;
        this.listElement = this.container.querySelector(".task-list");
        tasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            this.listElement.appendChild(taskElement);
        });
    }

    addTask(task: Task) {
        if (!this.listElement) {
            this.render(); // Should not happen if UI is visible
            return;
        }
        const taskElement = this.createTaskElement(task);
        this.listElement.prepend(taskElement);
    }

    private createTaskElement(task: Task): HTMLElement {
        const div = document.createElement("div");
        div.className = "task-item";
        div.dataset.taskId = task.id;
        div.innerHTML = `
            <input type="checkbox" ${task.isCompleted ? "checked" : ""}>
            <span class="task-name">${task.name}</span>
        `;
        return div;
    }
}
