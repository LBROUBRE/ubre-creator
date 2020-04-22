import config_with_yaml as config
import requests
cfg = config.load("config.yml")


BACKEND_IP = "%s:%s" % (cfg.getProperty("backend.ip"), cfg.getProperty("backend.service.port"))

reqs = requests.get("http://"+BACKEND_IP+"/movility/stops/").json()

for req in reqs:
    requests.delete("http://"+BACKEND_IP+"/movility/stops/%i" % req["id"])
    print("virtual stop %i: DELETED"%req["id"])
