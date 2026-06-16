import asyncio
from app.db.database import AsyncSessionLocal
from app.models.activity import Activity
from sqlalchemy import select

async def check():
    async with AsyncSessionLocal() as session:
        query = select(Activity).where(Activity.activity_type.like('%strength%'))
        result = await session.execute(query)
        activities = result.scalars().all()
        print(f"Found {len(activities)} strength activities")
        if activities:
            for a in activities[:1]:
                print(f"Activity ID: {a.garmin_id}, Type: {a.activity_type}")
                # Print some raw_data keys to see what's available
                if a.raw_data:
                    keys = [k for k in a.raw_data.keys() if 'reps' in k.lower() or 'set' in k.lower() or 'weight' in k.lower() or 'exercise' in k.lower()]
                    print(f"Relevant keys in raw_data: {keys}")
                    for k in keys:
                        print(f"  {k}: {a.raw_data[k]}")

if __name__ == '__main__':
    asyncio.run(check())
