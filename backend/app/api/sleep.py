from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.database import get_db
from app.models.health import SleepData
from app.schemas.sleep import SleepListItem, SleepListResponse, SleepDetailResponse

router = APIRouter(prefix="/sleep", tags=["sleep"])

@router.get("/", response_model=SleepListResponse)
async def list_sleep_records(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100)
):
    offset = (page - 1) * page_size

    # Base query for valid sleep
    base_q = select(SleepData).where(SleepData.sleep_time_seconds > 0)

    # Get total count
    count_q = select(func.count()).select_from(base_q.subquery())
    total = (await db.execute(count_q)).scalar() or 0

    # Get records
    query = base_q.order_by(SleepData.calendar_date.desc()).offset(offset).limit(page_size)
    result = await db.execute(query)
    records = result.scalars().all()

    sleep_items = []
    for r in records:
        raw = r.raw_data or {}
        heart_rate = raw.get("sleepHeartRate") or []
        stress = raw.get("sleepStress") or []

        sleep_items.append(SleepListItem(
            id=r.id,
            calendar_date=r.calendar_date,
            sleep_time_seconds=r.sleep_time_seconds,
            sleep_score=r.sleep_score,
            sleep_score_feedback=r.sleep_score_feedback,
            average_hrv=r.average_hrv,
            average_resting_heart_rate=r.average_resting_heart_rate,
            sleep_heart_rate=heart_rate,
            sleep_stress=stress
        ))

    return SleepListResponse(
        sleep_records=sleep_items,
        total=total,
        page=page,
        page_size=page_size,
        has_more=total > (offset + page_size)
    )

@router.get("/{record_id}", response_model=SleepDetailResponse)
async def get_sleep_record(
    record_id: int,
    db: AsyncSession = Depends(get_db)
):
    query = select(SleepData).where(SleepData.id == record_id)
    result = await db.execute(query)
    record = result.scalar_one_or_none()

    if not record:
        raise HTTPException(status_code=404, detail="Sleep record not found")

    return SleepDetailResponse.model_validate(record)
