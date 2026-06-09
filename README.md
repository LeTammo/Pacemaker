# Garmin Fitness Dashboard

A personal, clean, modern fitness dashboard for Garmin data.

## Features

- Automatic synchronization with Garmin Connect.
- Local SQLite database for fast access.
- API endpoints for activities, stats, health, and sleep.
- Docker support.

## Setup

1. Copy `.env.example` to `.env` and fill in your Garmin Connect credentials.
2. Run `docker-compose up -d`.
3. The API will be available at `http://localhost:8000`.
