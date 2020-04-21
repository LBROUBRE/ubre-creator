import config_with_yaml as config
import requests
cfg = config.load("config.yml")


BACKEND_IP = "%s:%s" % (cfg.getProperty("backend.ip"), cfg.getProperty("backend.service.port"))

reqs = requests.get("http://"+BACKEND_IP+"/movility/requests/").json()
json = {"estado":"PE"}
for req in reqs:
    requests.put("http://"+BACKEND_IP+"/movility/requests/%i" % req["id"], json=json)
    print("request %i: PE"%req["id"])
