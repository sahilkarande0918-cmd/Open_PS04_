"use client";

import { useActionState } from "react";
import { FormMessage, Submit } from "@/components/ui/form";
import { createProject } from "./actions";

export function NewProjectForm({ mode = "recording" }: { mode?: "recording" | "topic" }) {
  const [state, action] = useActionState(createProject, undefined);
  return (
    <form id="new-project" action={action} className="studio-panel grid scroll-mt-6 gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_220px_140px] lg:items-end">
      <label className="flex-1">
        <span className="text-[13px] text-muted">Project name</span>
        <input
          name="name"
          required
          maxLength={120}
          placeholder="React hooks — class 7"
          className="studio-input mt-2"
        />
      </label>
      <label>
        <span className="text-[13px] text-muted">Mode</span>
        <select
          name="mode"
          defaultValue={mode}
          className="studio-input mt-2"
        >
          <option value="recording">Recording → Reels</option>
          <option value="topic">Topic → Video</option>
        </select>
      </label>
      <div>
        <Submit>Create project</Submit>
      </div>
      <div className="lg:col-span-3">
        <FormMessage state={state} />
      </div>
    </form>
  );
}
