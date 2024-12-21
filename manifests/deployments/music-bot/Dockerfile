FROM python:3.10-slim

WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y \
    git \
    ffmpeg \
    && apt-get clean

RUN git clone https://github.com/KUNszg/MusicBot

WORKDIR /usr/src/app/MusicBot

RUN pip install --no-cache-dir -r requirements.txt

CMD ["python", "run.py"]


