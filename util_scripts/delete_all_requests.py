import config_with_yaml as config
import requests
cfg = config.load("config.yml")


BACKEND_IP = "%s:%s" % (cfg.getProperty("backend.ip"), cfg.getProperty("backend.service.port"))

reqs = requests.get("http://"+BACKEND_IP+"/movility/requests/").json()

for req in reqs:
    requests.delete("http://"+BACKEND_IP+"/movility/requests/%i" % req["id"])
    print("request %i: DELETED"%req["id"])