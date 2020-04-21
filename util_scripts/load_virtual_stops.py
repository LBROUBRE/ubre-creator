import config_with_yaml as config
import requests
from data.paradasVirtuales import paradasVirtualesFiltradas
cfg = config.load("config.yml")


BACKEND_IP = "%s:%s" % (cfg.getProperty("backend.ip"), cfg.getProperty("backend.service.port"))

for coords in paradasVirtualesFiltradas:
    json = dict()
    json["coordenadas"] = str(coords[1]) + "," + str(coords[0])
    print("Loading stop: " + str(coords[1]) + "," + str(coords[0]))
    requests.post("http://"+BACKEND_IP+"/movility/stops/",json=json)