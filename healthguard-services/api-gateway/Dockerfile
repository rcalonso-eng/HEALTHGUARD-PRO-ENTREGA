FROM python:3.11-slim
WORKDIR /app
# Instalamos flask, cors y httpx directamente
RUN pip install --no-cache-dir flask flask-cors httpx
COPY . .
EXPOSE 5000
CMD ["python", "gateway.py"]