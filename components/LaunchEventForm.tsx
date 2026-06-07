"use client";

import { useState } from "react";
import { launchClassAction } from "@/lib/staff/actions";

export function LaunchEventForm({
  courseId,
  defaultTitle,
}: {
  courseId: string;
  defaultTitle: string;
}) {
  const [mode, setMode] = useState<"telehealth" | "in_person">("telehealth");

  return (
    <form action={launchClassAction} className="card space-y-3">
      <h2 className="font-semibold text-brand-900">Launch an event from this course</h2>
      <p className="text-xs text-brand-500">
        The curriculum is snapshotted at launch, so later edits won't change a running event.
      </p>

      <input type="hidden" name="courseId" value={courseId} />

      <div>
        <label className="label" htmlFor="title">Event title</label>
        <input id="title" name="title" className="input" defaultValue={defaultTitle} />
      </div>

      <div>
        <label className="label" htmlFor="description">Description</label>
        <textarea id="description" name="description" className="input min-h-[60px]" placeholder="What parents will do at this session…" />
      </div>

      <div>
        <label className="label" htmlFor="coverImage">Cover image URL (optional)</label>
        <input id="coverImage" name="coverImage" className="input" placeholder="/media/events/telehealth.svg" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="startsAt">Date & time</label>
          <input id="startsAt" name="startsAt" type="datetime-local" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="capacity">Capacity</label>
          <input id="capacity" name="capacity" type="number" min={1} defaultValue={12} className="input" />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="schedule">Schedule label</label>
        <input id="schedule" name="schedule" className="input" placeholder="e.g. One session, 45 min" />
      </div>

      <div>
        <label className="label">Delivery</label>
        <div className="inline-flex overflow-hidden rounded-lg border border-brand-200 text-sm">
          {(["telehealth", "in_person"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 font-medium ${mode === m ? "bg-brand-600 text-white" : "bg-white text-brand-600"}`}
            >
              {m === "telehealth" ? "Telehealth" : "In person"}
            </button>
          ))}
        </div>
        <input type="hidden" name="deliveryMode" value={mode} />
      </div>

      {mode === "telehealth" ? (
        <div>
          <label className="label" htmlFor="meetingLink">Meeting link (paste Zoom/Meet URL)</label>
          <input id="meetingLink" name="meetingLink" className="input" placeholder="https://zoom.us/j/…" />
          <p className="mt-1 text-xs text-brand-500">Shown to RSVP'd parents only.</p>
        </div>
      ) : (
        <div>
          <label className="label" htmlFor="address">Address</label>
          <input id="address" name="address" className="input" placeholder="11748 Magnolia Ave Suite B, Riverside, CA" />
        </div>
      )}

      <button className="btn-accent w-full" type="submit">Launch event</button>
    </form>
  );
}
