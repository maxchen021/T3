from flask import Flask, render_template, request, redirect, url_for, jsonify, make_response
import os, json
import gunicorn.app.base
import multiprocessing
import requests

app = Flask(__name__)

@app.route("/")
def index_html():
    return render_template("index.html")

@app.route("/api/get-data-from-url")
def get_data_from_url():
    try:
        request_data = request.args
        #print(request_data)
        if request_data.get("url"):
            response = requests.get(request_data["url"])
            return_response = make_response(response.text)
            return_response.status_code = response.status_code
            return_response.headers.set("Content-Type", "text/plain; charset=utf-8")
            return return_response
        else:
            return ""
    except:
        return ""

def number_of_gunicorn_workers():
    """This calculate the number of gunicorn worker based on the number of cpu
    Returns:
        int: number of gunicorn workers
    """
    cpu_count = multiprocessing.cpu_count()
    number_of_workers = 4
    if cpu_count:
        number_of_workers = cpu_count
    print(f"number of workers: {number_of_workers}")
    return number_of_workers


class GunicornApplication(gunicorn.app.base.BaseApplication):
    """This class is used to start the flask app using gunicorn
    Args:
        gunicorn (class): gunicorn base application class
    """

    def __init__(self, application, options=None):
        """init function
        Args:
            application (class): Flask app class instance
            options (dict, optional): dictionary containing the gunicorn config options. Defaults to None.
        """
        self.options = options or {}
        self.application = application
        super().__init__()

    def load_config(self):
        """Load the gunicorn config options"""
        config = {key: value for key, value in self.options.items() if key in self.cfg.settings and value is not None}
        for key, value in config.items():
            self.cfg.set(key.lower(), value)

    def load(self):
        """Load the flask application
        Returns:
            class: Flask app class instance
        """
        return self.application


if __name__ == "__main__":
    # GUNICORN config settings / options
    # https://docs.gunicorn.org/en/stable/settings.html#settings
    options = {
        "bind": "0.0.0.0:" + os.getenv("T3_HTTP_PORT", "8080"),
        "workers": number_of_gunicorn_workers(),
        "threads": 1,
        "timeout": 300,
        "keepalive": 300,
        "limit_request_line": 0,
        "capture_output": True,
        "enable_stdio_inheritance": True,
        "accesslog": os.getenv("T3_GUNICORN_ACCESSLOG"),
        "errorlog": os.getenv("T3_GUNICORN_ERRORLOG","-"),
    }
    GunicornApplication(app, options).run()