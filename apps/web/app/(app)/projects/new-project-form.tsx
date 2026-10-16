"use client";

import { useActionState } from "react";
import { FormMessage, Submit } from "@/components/ui/form";
import { createProject } from "./actions";

export function NewProjectForm() {
  const [state, action] = useActionState(createProject, undefined);
  return (
    <form action={action} className="flex flex-col gap-3 rounded-[6px] bg-surface p-4 sm:flex-row sm:items-end">
      <label className="flex-1">
        <span className="text-[13px] text-muted">Project name</span>
        <input
          name="name"
          required
          maxLength={120}
          placeholder="React hooks — class 7"
          className="mt-1 block w-full rounded-[4px] bg-surface-2 px-3 py-2 text-[15px] outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
      </label>
      <label>
        <span className="text-[13px] text-muted">Mode</span>
        <select
          name="mode"
          defaultValue="recording"
          className="mt-1 block w-full rounded-[4px] bg-surface-2 px-3 py-2 text-[15px] outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <option value="recording">Recording → Reels</option>
          <option value="topic">Topic → Video</option>
        </select>
      </label>
      <div className="sm:w-40">
        <Submit>Create</Submit>
      </div>
      <div className="sm:basis-full">
        <FormMessage state={state} />
      </div>
    </form>
  );
}
