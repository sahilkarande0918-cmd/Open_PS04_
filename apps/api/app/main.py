import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import health, recordings
from app.core import heartbeat
from app.core.config import get_settings


@asynccontextmanager
async def lifespan(_: FastAPI):
    s = get_settings()
    task = (
        asyncio.create_task(heartbeat.run_forever()) if s.public_api_url and s.supabase_configured else None
    )
    yield
    if task:
        task.cancel()


app = FastAPI(title="Reel Studio API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type", "Content-Range", "Upload-Offset"],
)

app.include_router(health.router)
app.include_router(recordings.router)
