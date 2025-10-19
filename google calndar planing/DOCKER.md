# Docker commands for Production Planner

## Build and run with Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose up -d --build
```

## Access

- Frontend: http://localhost
- API: http://localhost/api/
- API Docs: http://localhost/docs

## Environment Variables

Create `.env` file before running:

```env
OPENAI_API_KEY=your_key
WEATHER_API_KEY=your_key
WEATHER_LOCATION=Bratislava,SK
```

## Using PostgreSQL

Uncomment the postgres service in `docker-compose.yml` and update:

```env
DATABASE_URL=postgresql://planner:planner_password@postgres:5432/production_planner
```

## Production Deployment

### 1. Update nginx.conf with your domain
### 2. Use environment variables for secrets
### 3. Add SSL/TLS certificates
### 4. Set up proper logging
### 5. Configure backups

## Useful Commands

```bash
# Execute command in container
docker-compose exec api python test_setup.py

# View API logs
docker-compose logs -f api

# Restart API only
docker-compose restart api

# Remove all data and restart fresh
docker-compose down -v
docker-compose up -d

# Backup database
docker-compose exec api cp /app/data/production_planner.db /app/data/backup.db

# Access container shell
docker-compose exec api /bin/bash
```


