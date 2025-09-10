import { Plugin, fetchPost } from "siyuan";
import { Task } from "./types";
import { uuidv4 } from "./utils";

export class SiyuanApi {
    private plugin: Plugin;

    constructor(plugin: Plugin) {
        this.plugin = plugin;
    }

    private async getNotebookId(): Promise<string> {
        // TODO: This should be configurable by the user.
        // For now, it will be the first open notebook.
        const notebooks = await fetchPost("/api/notebook/lsNotebooks", {});
        return notebooks.data.notebooks[0]?.id;
    }

    async getDailyNoteId(date: Date): Promise<string> {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const dateString = `${year}${month}${day}`;

        // TODO: The daily note path should be retrieved from Siyuan's config.
        const dailyNotePath = `/Daily Notes/${dateString}.sy`;

        const notebookId = await this.getNotebookId();
        if (!notebookId) {
            console.error("No notebook found.");
            return null;
        }

        const sql = `SELECT id FROM blocks WHERE path = '${dailyNotePath}' AND type = 'd'`;
        const blocks = await fetchPost("/api/query/sql", { stmt: sql });

        if (blocks.data.length > 0) {
            return blocks.data[0].id;
        } else {
            const newDoc = await fetchPost("/api/filetree/createDocWithMd", {
                notebook: notebookId,
                path: dailyNotePath,
                markdown: ""
            });
            await fetchPost("/api/attr/setBlockAttrs", {
                id: newDoc.data,
                attrs: { "custom-dailynote-yyyymmdd": dateString }
            });
            return newDoc.data;
        }
    }

    async createTask(task: Partial<Task>): Promise<void> {
        const now = new Date();
        const dailyNoteId = await this.getDailyNoteId(now);

        if (!dailyNoteId) {
            console.error("Could not find or create daily note.");
            return;
        }

        const taskId = uuidv4();
        const fullTask: Task = {
            id: taskId,
            name: task.name,
            listId: task.listId || "inbox",
            tags: task.tags || [],
            isCompleted: false,
            isDeleted: false,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            content: task.content || "",
        };

        const attrs = {
            "custom-task-id": fullTask.id,
            "custom-task-name": fullTask.name,
            "custom-task-list-id": fullTask.listId,
            "custom-task-tags": JSON.stringify(fullTask.tags),
            "custom-task-is-completed": fullTask.isCompleted.toString(),
            "custom-task-is-deleted": fullTask.isDeleted.toString(),
            "custom-task-created-at": fullTask.createdAt,
            "custom-task-updated-at": fullTask.updatedAt,
        };

        if (fullTask.dueDate) {
            attrs["custom-task-duedate"] = fullTask.dueDate;
        }
        if (fullTask.startDate) {
            attrs["custom-task-startdate"] = fullTask.startDate;
        }
        if (fullTask.endDate) {
            attrs["custom-task-enddate"] = fullTask.endDate;
        }
        if (fullTask.parentId) {
            attrs["custom-task-parent-id"] = fullTask.parentId;
        }

        await fetchPost("/api/block/insertBlock", {
            dataType: "markdown",
            parentID: dailyNoteId,
            data: fullTask.content,
            attrs: attrs,
        });
        return fullTask;
    }

    async getTasks(): Promise<Task[]> {
        const sql = `
            SELECT
                b.id,
                b.content,
                MAX(CASE WHEN a.name = 'custom-task-id' THEN a.value END) AS task_id,
                MAX(CASE WHEN a.name = 'custom-task-name' THEN a.value END) AS task_name,
                MAX(CASE WHEN a.name = 'custom-task-list-id' THEN a.value END) AS task_list_id,
                MAX(CASE WHEN a.name = 'custom-task-tags' THEN a.value END) AS task_tags,
                MAX(CASE WHEN a.name = 'custom-task-is-completed' THEN a.value END) AS task_is_completed,
                MAX(CASE WHEN a.name = 'custom-task-is-deleted' THEN a.value END) AS task_is_deleted,
                MAX(CASE WHEN a.name = 'custom-task-created-at' THEN a.value END) AS task_created_at,
                MAX(CASE WHEN a.name = 'custom-task-updated-at' THEN a.value END) AS task_updated_at,
                MAX(CASE WHEN a.name = 'custom-task-duedate' THEN a.value END) AS task_duedate,
                MAX(CASE WHEN a.name = 'custom-task-startdate' THEN a.value END) AS task_startdate,
                MAX(CASE WHEN a.name = 'custom-task-enddate' THEN a.value END) AS task_enddate,
                MAX(CASE WHEN a.name = 'custom-task-parent-id' THEN a.value END) AS task_parent_id
            FROM
                blocks b
            LEFT JOIN
                attributes a ON b.id = a.block_id
            WHERE
                b.id IN (SELECT block_id FROM attributes WHERE name = 'custom-task-id')
            GROUP BY
                b.id
        `;
        const results = await fetchPost("/api/query/sql", { stmt: sql });

        const tasks: Task[] = results.data.map((row: any) => {
            return {
                id: row.task_id,
                name: row.task_name,
                listId: row.task_list_id,
                tags: JSON.parse(row.task_tags || "[]"),
                isCompleted: row.task_is_completed === "true",
                isDeleted: row.task_is_deleted === "true",
                createdAt: row.task_created_at,
                updatedAt: row.task_updated_at,
                content: row.content,
                dueDate: row.task_duedate,
                startDate: row.task_startdate,
                endDate: row.task_enddate,
                parentId: row.task_parent_id,
            };
        }).filter((task: Task) => !task.isDeleted);

        return tasks;
    }
}
