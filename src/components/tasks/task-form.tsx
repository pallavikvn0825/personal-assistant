"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Label } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createTaskAction } from "@/lib/actions";
import { X } from "lucide-react";
import type { Priority, RecurrenceType } from "@prisma/client";

interface TaskFormProps {
  onClose?: () => void;
  defaultValues?: {
    title?: string;
    projectId?: string;
    goalId?: string;
  };
  projects?: { id: string; name: string }[];
}

export function TaskForm({ onClose, defaultValues, projects = [] }: TaskFormProps) {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(defaultValues?.title ?? "");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [estimatedMinutes, setEstimatedMinutes] = useState("");
  const [category, setCategory] = useState("");
  const [projectId, setProjectId] = useState(defaultValues?.projectId ?? "");
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>("NONE");
  const [isTopPriority, setIsTopPriority] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    startTransition(async () => {
      await createTaskAction({
        title: title.trim(),
        description: description || undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        dueTime: dueTime || undefined,
        priority,
        estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes) : undefined,
        category: category || undefined,
        projectId: projectId || undefined,
        recurrenceType,
        isTopPriority,
      });
      onClose?.();
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>New Task</CardTitle>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded-md hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              required
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="dueTime">Due Time</Label>
              <Input
                id="dueTime"
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
              >
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="duration">Est. Duration (min)</Label>
              <Input
                id="duration"
                type="number"
                min="5"
                step="5"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
                placeholder="30"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Study, Work"
              />
            </div>
            {projects.length > 0 && (
              <div>
                <Label htmlFor="project">Project</Label>
                <Select
                  id="project"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                >
                  <option value="">None</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="recurrence">Recurrence</Label>
            <Select
              id="recurrence"
              value={recurrenceType}
              onChange={(e) => setRecurrenceType(e.target.value as RecurrenceType)}
            >
              <option value="NONE">One-time</option>
              <option value="DAILY">Every day</option>
              <option value="WEEKDAYS">Weekdays</option>
              <option value="WEEKLY">Every week</option>
            </Select>
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={isTopPriority}
              onChange={(e) => setIsTopPriority(e.target.checked)}
              className="rounded"
            />
            Set as today&apos;s top priority
          </label>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isPending || !title.trim()}>
              {isPending ? "Creating..." : "Create Task"}
            </Button>
            {onClose && (
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
