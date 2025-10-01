.PHONY: dev backend frontend clean

dev:   ## Start both Flask backend and React dev server
	./scripts/start-dev.sh

backend:  ## Start only the Flask backend (expects venv at flask-backend/.venv)
	cd flask-backend && source .venv/bin/activate && export FLASK_APP=app.py && export FLASK_ENV=development && python app.py

frontend: ## Start only the React frontend
	cd client && npm run dev:frontend

clean: ## Remove Python venv and node_modules (use with caution)
	rm -rf flask-backend/.venv client/node_modules
