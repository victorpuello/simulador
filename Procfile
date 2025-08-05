web: cd backend && gunicorn simulador.wsgi:application --bind 0.0.0.0:$PORT
release: cd backend && python manage.py migrate --noinput && python manage.py collectstatic --noinput