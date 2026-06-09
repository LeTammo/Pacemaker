from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.activity import Activity
from app.schemas.activity import ActivityListResponse, ActivityResponse

router = APIRouter(prefix="/activities", tags=["activities"])

@router.get("/", response_model=ActivityListResponse)
async def list_activities(
    db: AsyncSession = Depends(get_db),
    page: int = 1,
    page_size: int = 20
):
    offset = (page - 1) * page_size
    
    # Get total count
    count_query = select(Activity)
    result = await db.execute(count_query)
    total = len(result.scalars().all())
    
    # Get activities
    query = select(Activity).offset(offset).limit(page_size).order_by(Activity.start_time.desc())
    result = await db.execute(query)
    activities = result.scalars().all()
    
    return ActivityListResponse(
        activities=[ActivityResponse.model_validate(a) for a in activities],
        total=total,
        page=page,
        page_size=page_size,
        has_more=total > (offset + page_size)
    )

@router.get("/{activity_id}", response_model=ActivityResponse)
async def get_activity(
    activity_id: int,
    db: AsyncSession = Depends(get_db)
):
    query = select(Activity).where(Activity.id == activity_id)
    result = await db.execute(query)
    activity = result.scalar_one_or_none()
    
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
        
    return ActivityResponse.model_validate(activity)
