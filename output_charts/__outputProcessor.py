import json
import requests as rest
from datetime import datetime as dt

class OuputProcessor:

    OSRM_FOOT = "http://127.0.0.1:5000/route/v1/foot/"

    def __init__(self,output_file_name):
        with open(output_file_name) as outfile:
            self.out = json.load(outfile)

    def getRequests(self):
        return self.out["solicitudes"]
    
    def getRequest(self,request_id):
        request = (req for req in self.out["solicitudes"] if req["id"] == request_id and req["estado"] == "A")
        if not request: return None
        else: return request[0]
    
    def getRoutes(self):
        return self.out["rutas"]

    def getRoute(self,route_id):
        route = (route for route in self.out["rutas"] if route["id"] == request_id)
        if not route: return None
        else: return route[0]



    def getAcceptedRequests(self):
        return (req for req in self.out["solicitudes"] if req["estado"] == "A")
    
    def getRejectedRequests(self):
        return (req for req in self.out["solicitudes"] if req["estado"] == "R")



    def getVehicleOccupationAverage(self, route_id):
        route = self.getRoute(route_id)
        av = 0.0
        for sect in route["tramos"]:
            av += sect["pasajeros"]/len(route["tramos"])
        return av
    
    def getPedestrianSegment(self,request_id):
        request = self.getRequest(request_id)
        origin_res = rest.get(self.OSRM_FOOT+"%s/%s" % (request["origen_deseado"],request["origen_real"])).json()
        destination_res = rest.get(self.OSRM_FOOT+"%s/%s" % (request["destino_deseado"],request["destino_real"])).json()
        return {
            "pickup":{
                "distance":origin_res["distance"],
                "duration":origin_res["duration"]
            },
            "delivery":{
                "distance":destination_res["distance"],
                "duration":destination_res["duration"]
            }
        }

    def getDifferRequiredProvidedTimeValues(self,request_id):
        request = self.getRequest(request_id)
        return {
            "pickup":dt.timestamp(dt.strptime(request["hora_salida_real"],f'%Y-%m-%dT%H:%M:%SZ'))-dt.timestamp(dt.strptime(request["hora_salida_deseada"],f'%Y-%m-%dT%H:%M:%SZ')),
            "delivery":dt.timestamp(dt.strptime(request["hora_llegada_real"],f'%Y-%m-%dT%H:%M:%SZ'))-dt.timestamp(dt.strptime(request["hora_llegada_deseada"],f'%Y-%m-%dT%H:%M:%SZ'))
        }
    
    def getHandledRequestsByRoute(self,route_id):
        route = self.getRoute(route_id)
        return (self.getRequest(req_id) for req_id in route["solicitudes_atendidas"])

    

    def getAcceptedRequestsRate(self):
        return len(self.getAcceptedRequests())/len(self.out["solicitudes"])
    
    def getRejectedRequestsRate(self):
        return len(self.getRejectedRequests())/len(self.out["solicitudes"])

    def getVehicleOccupationAverageRate(self):
        rt = 0.0
        for av_route in (self.getVehicleOccupationAverage(route["id"]) for route in self.getRoutes):
            rt += av_route/len(self.getAcceptedRequests())
        return rt