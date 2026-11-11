FROM python:3.12-slim

ENV PIP_NO_CACHE_DIR=1
RUN pip install --no-cache-dir "piper-tts[http]" \
 && mkdir -p /voices \
 && python -m piper.download_voices --data-dir /voices id_ID-news_tts-medium

EXPOSE 5000
CMD ["python", "-m", "piper.http_server", "-m", "id_ID-news_tts-medium", "--data-dir", "/voices", "--host", "0.0.0.0", "--port", "5000"]
