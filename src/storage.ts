import { Plugin } from "siyuan";
import { PluginConfig, TaskList } from "./types";

const STORAGE_NAME_CONFIG = "aquatask-config";
const STORAGE_NAME_LISTS = "aquatask-lists";

export class Storage {
    private plugin: Plugin;

    constructor(plugin: Plugin) {
        this.plugin = plugin;
    }

    async saveConfig(config: PluginConfig) {
        await this.plugin.saveData(STORAGE_NAME_CONFIG, config);
    }

    async loadConfig(): Promise<PluginConfig> {
        const config = await this.plugin.loadData(STORAGE_NAME_CONFIG);
        return config || { kimiApiKey: "" };
    }

    async saveTaskLists(lists: TaskList[]) {
        await this.plugin.saveData(STORAGE_NAME_LISTS, lists);
    }

    async loadTaskLists(): Promise<TaskList[]> {
        const lists = await this.plugin.loadData(STORAGE_NAME_LISTS);
        return lists || [{ id: "inbox", name: "Inbox", isDefault: true }];
    }
}
