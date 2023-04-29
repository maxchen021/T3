ARG ARCH=
FROM ${ARCH}python:3.11-alpine
COPY flask_app /opt/T3
RUN pip install -r /opt/T3/requirements.txt && adduser -D python && chown -R python /opt/T3 && mkdir /etc/T3 && chown -R python /etc/T3
USER python
WORKDIR /opt/T3
ENTRYPOINT ["python", "app.py"]
