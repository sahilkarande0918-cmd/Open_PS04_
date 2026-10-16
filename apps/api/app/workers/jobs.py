"""Job bookkeeping shared by worker handlers: progress, events, cancellation."""

from app.core.db import service_client


class Cancelled(Exception):
    pass


class Permanent(Exception):
    """A failure retrying cannot fix (bad media, missing file)."""


class JobContext:
    def __init__(self, job: dict):
        self.job = job
        self.id = job["id"]
        self.payload = job.get("payload") or {}

    def stage(self, name: str, progress: float, message: str | None = None) -> None:
        self.check_cancel()
        db = service_client()
        db.table("jobs").update({"current_stage": name, "progress": round(min(max(progress, 0), 1), 4)}).eq(
            "id", self.id
        ).execute()
        db.table("job_events").insert(
            {"job_id": self.id, "stage": name, "message": message or name, "progress": progress}
        ).execute()

    def progress(self, progress: float) -> None:
        service_client().table("jobs").update({"progress": round(min(max(progress, 0), 1), 4)}).eq(
            "id", self.id
        ).execute()

    def check_cancel(self) -> None:
        row = (
            service_client()
            .table("jobs")
            .select("cancel_requested")
            .eq("id", self.id)
            .single()
            .execute()
            .data
        )
        if row and row["cancel_requested"]:
            raise Cancelled()
