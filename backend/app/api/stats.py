from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.database import get_db
from app.models.activity import Activity
from app.schemas.stats import StatsResponse

router = APIRouter(prefix="/stats", tags=["stats"])

@router.get("/", response_model=StatsResponse)
async def get_stats(db: AsyncSession = Depends(get_db)):
    # Simple example, needs more robust implementation
    query = select(func.count(Activity.id), func.sum(Activity.distance_meters))
    result = await db.execute(query)
    count, total_distance = result.one()
    
    return StatsResponse(
        total_activities=count or 0,
        total_distance=total_distance or 0.0
    )
