from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, distinct
from app.db.database import get_db
from app.models.activity import Activity
from app.schemas.activity import ActivityListResponse, ActivityResponse

router = APIRouter(prefix="/activities", tags=["activities"])


@router.get("/types", response_model=list[str])
async def list_activity_types(db: AsyncSession = Depends(get_db)):
    """Return all distinct activity_type values present in the database."""
    result = await db.execute(select(distinct(Activity.activity_type)).order_by(Activity.activity_type))
    return [row[0] for row in result.fetchall() if row[0]]

@router.get("/", response_model=ActivityListResponse)
async def list_activities(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    activity_type: str | None = Query(None, alias="type")
):
    offset = (page - 1) * page_size
    
    # Base query
    base_q = select(Activity)
    if activity_type:
        base_q = base_q.where(Activity.activity_type == activity_type)

    # Get total count
    result = await db.execute(base_q)
    total = len(result.scalars().all())
    
    # Get activities
    query = base_q.order_by(Activity.start_time.desc()).offset(offset).limit(page_size)
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
