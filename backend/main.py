from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .config import settings
from .routers import auth, farmers, soil_reports, recommendations, chat

app = FastAPI(
    title="KrishiSaathi AI Backend",
    description="Agricultural AI platform for Indian farmers: Soil Health Card analysis, fertilizer recommendations, and multilingual voice assistant.",
    version="2.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure upload directory exists and serve static uploads
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(settings.UPLOAD_DIR)), name="uploads")

# Include Routers
app.include_router(auth.router)
app.include_router(farmers.router)
app.include_router(soil_reports.router)
app.include_router(recommendations.router)
app.include_router(chat.router)

@app.get("/")
def root():
    return {
        "platform": "KrishiSaathi (कृषि साथी)",
        "version": "2.0.0",
        "status": "online",
        "docs_url": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "database": "connected"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=True)
