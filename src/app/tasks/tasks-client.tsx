"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TaskItem } from "@/components/tasks/task-item";
import { TaskForm } from "@/components/tasks/task-form";
import { Input, Select } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import type { TaskWithRelations } from "@/types";

interface TasksPageClientProps {
  tasks: TaskWithRelations[];
  projects: { id: string; name: string }[];
}

export function TasksPageClient({ tasks, projects }: TasksPageClientProps) {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const filtered = tasks.filter((task) => {
    if (search && !task.title.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (statusFilter === "active" && !["PENDING", "IN_PROGRESS"].includes(task.status)) {
      return false;
    }
    if (statusFilter === "completed" && task.status !== "COMPLETED") {
      return false;
    }
    if (priorityFilter !== "all" && task.priority !== priorityFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground mt-1">
            {filtered.length} task{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>

      {showForm && (
        <TaskForm
          onClose={() => setShowForm(false)}
          projects={projects}
        />
      )}

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-auto"
        >
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="all">All</option>
        </Select>
        <Select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="w-auto"
        >
          <option value="all">All priorities</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </Select>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No tasks found.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setShowForm(true)}
            >
              Create your first task
            </Button>
          </div>
        ) : (
          filtered.map((task) => <TaskItem key={task.id} task={task} />)
        )}
      </div>
    </div>
  );
}
