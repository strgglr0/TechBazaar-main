from app import create_app
from extensions import db


def main():
    app = create_app()
    with app.app_context():
        inspector = db.inspect(db.engine)
        tables = inspector.get_table_names()
        print("Database tables:", tables)
        if tables:
            print("Database connection and schema are working.")
        else:
            print("No tables found. Database may not be initialized.")


if __name__ == '__main__':
    main()
