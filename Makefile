.PHONY: dev up down build logs migrate seed test lint

dev:
	docker compose up --build

up:
	docker compose up -d

down:
	docker compose down

build:
	docker compose build

logs:
	docker compose logs -f

backend-logs:
	docker compose logs -f backend

frontend-logs:
	docker compose logs -f frontend

migrate:
	docker compose exec backend alembic upgrade head

migration:
	docker compose exec backend alembic revision --autogenerate -m "$(msg)"

seed:
	docker compose exec backend python -m app.seed

test-backend:
	docker compose exec backend pytest -v

lint-backend:
	docker compose exec backend ruff check app/

shell:
	docker compose exec backend python

db-shell:
	docker compose exec db psql -U webtoapp -d webtoapp

redis-cli:
	docker compose exec redis redis-cli

clean:
	docker compose down -v --remove-orphans
