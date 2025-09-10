import { Plugin, Dialog, openTab, Setting } from "siyuan";
import { SiyuanApi } from "./api";
import { Storage } from "./storage";
import { i18n } from "./utils";
import { TaskListUI } from "./ui";

export default class AquaTaskPlugin extends Plugin {
    private storage: Storage;
    public api: SiyuanApi;
    private taskListUI: TaskListUI;
    private tab: () => any;
    private setting: Setting;


    async onload() {
        this.storage = new Storage(this);
        this.api = new SiyuanApi(this);
        i18n.setLanguage(this.i18n.lang);

        this.addIcons(`<symbol id="iconTask" viewBox="0 0 1024 1024"><path d="M512 1024C229.248 1024 0 794.752 0 512S229.248 0 512 0s512 229.248 512 512-229.248 512-512 512z m0-64c247.424 0 448-200.576 448-448S759.424 64 512 64 64 264.576 64 512s200.576 448 448 448z" fill="#2c2c2c" p-id="4249"></path><path d="M742.4 358.4c-12.8-12.8-32-12.8-44.8 0L460.8 595.2l-115.2-115.2c-12.8-12.8-32-12.8-44.8 0s-12.8 32 0 44.8l137.6 137.6c12.8 12.8 32 12.8 44.8 0L742.4 403.2c12.8-12.8 12.8-32 0-44.8z" fill="#2c2c2c" p-id="4250"></path></symbol>`);

        this.tab = this.addTab({
            type: "aquatask_tab",
            init: () => {
                this.element.innerHTML = `<div id="aquatask-container" class="fn__flex-1"></div>`;
                const container = this.element.querySelector("#aquatask-container");
                this.taskListUI = new TaskListUI(container as HTMLElement, this.api);
                this.taskListUI.render();
            },
            destroy() {}
        });

        this.addTopBar({
            icon: "#iconTask",
            title: "AquaTask",
            callback: () => {
                openTab({
                    app: this.app,
                    custom: {
                        icon: "#iconTask",
                        title: "AquaTask",
                        data: {},
                        id: this.name + "aquatask_tab"
                    },
                });
            }
        });

        this.addCommand({
            langKey: "createTask",
            hotkey: "⇧⌘N",
            callback: () => {
                this.showCreateTaskDialog();
            },
        });

        this.setting = new Setting({
            confirmCallback: async () => {
                const newConfig = {
                    kimiApiKey: (this.setting.elements[0].querySelector("input") as HTMLInputElement).value,
                };
                await this.storage.saveConfig(newConfig);
            }
        });

        const config = await this.storage.loadConfig();
        this.setting.addItem({
            title: "Kimi API Key",
            createActionElement: () => {
                const input = document.createElement("input");
                input.className = "b3-text-field";
                input.type = "password";
                input.value = config.kimiApiKey;
                return input;
            }
        });

        const lists = await this.storage.loadTaskLists();
        this.setting.addItem({
            title: "Task Lists",
            description: "Manage your task lists",
            createActionElement: () => {
                const container = document.createElement("div");
                lists.forEach(list => {
                    const div = document.createElement("div");
                    div.textContent = list.name;
                    container.appendChild(div);
                });
                return container;
            }
        });


        console.log("AquaTask plugin loaded");
    }

    onunload() {
        console.log("AquaTask plugin unloaded");
    }

    private showCreateTaskDialog() {
        const dialog = new Dialog({
            title: i18n.t("createTask"),
            content: `<div class="b3-dialog__content">
    <textarea class="b3-text-field fn__block" id="task-name" placeholder="${i18n.t("taskName")}"></textarea>
    <div class="fn__hr"></div>
    <textarea class="b3-text-field fn__block" id="task-description" placeholder="${i18n.t("taskDescription")}"></textarea>
</div>
<div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel">${i18n.t("cancel")}</button><div class="fn__space"></div>
    <button class="b3-button b3-button--text">${i18n.t("create")}</button>
</div>`,
            width: "520px",
        });

        const taskNameElement = dialog.element.querySelector("#task-name") as HTMLTextAreaElement;
        const taskDescriptionElement = dialog.element.querySelector("#task-description") as HTMLTextAreaElement;
        const btnsElement = dialog.element.querySelectorAll(".b3-button");

        btnsElement[0].addEventListener("click", () => {
            dialog.destroy();
        });

        btnsElement[1].addEventListener("click", async () => {
            const taskName = taskNameElement.value;
            const taskDescription = taskDescriptionElement.value;
            const newTask = await this.api.createTask({
                name: taskName,
                content: taskDescription,
            });
            if (newTask && this.taskListUI) {
                this.taskListUI.addTask(newTask);
            }
            dialog.destroy();
        });
    }
}
