import config_with_yaml as config
import requests
import random
from datetime import datetime, timedelta
from placesLists import origins, destinations
cfg = config.load("config.yml")

BACKEND_ADDRESS= "%s:%s" % (cfg.getProperty("backend.ip"), cfg.getProperty("backend.service.port"))

class RequestsSimulator():

    def __init__(self, BACKEND_ADDRESS, groups_number, origins_list, destinations_list, pickup_datetime, delivery_datetime, time_dispersion=0, random_destination=True):
        self.BACKEND_ADDRESS = BACKEND_ADDRESS
        self.groups_number = groups_number
        self.origins_list = origins_list
        self.destinations_list = destinations_list
        self.pickup_datetime = datetime.strptime(pickup_datetime,f'%Y-%m-%dT%H:%M:%SZ')
        self.delivery_datetime = datetime.strptime(delivery_datetime,f'%Y-%m-%dT%H:%M:%SZ')
        self.time_dispersion = time_dispersion
        self.random_destination = random_destination
        self.pickupDatetimeGenerator = self.getNextPickupDatetime()
        self.deliveryDatetimeGenerator = self.getNextDeliveryDatetime()
        self.usersDNIs = [user["dni"] for user in self.getUsersFromDB()]
    

    def createRequestsGroup(self):
        requests = []
        pickupDatetime = next(self.pickupDatetimeGenerator)
        deliveryDate = next(self.deliveryDatetimeGenerator)
        for _ in range(0,self.groups_number):
            user = self.getRandomUserDNI()
            origin = self.getRandomOrigin()
            destination = self.getRandomDestination()
            pickupDatetime = pickupDatetime
            deliveryDatetime = deliveryDate
            requests.append(self.createRequestData(user, origin, destination, pickupDatetime, deliveryDatetime))
        return requests

    def createRequestData(self, user, origin, destination, pickupDatetime, deliveryDatetime):
        data = {
            "usuario":user,
            "origen":"%s,%s" % (origin[0],origin[1]),
            "destino":"%s,%s" % (destination[0],destination[1]),
            "fechaHoraSalida":pickupDatetime.strftime(f'%Y-%m-%dT%H:%M:%SZ'),
            "fechaHoraLlegada":deliveryDatetime.strftime(f'%Y-%m-%dT%H:%M:%SZ')
        }
        return data


    def getUsersFromDB(self):
        users = requests.get("http://"+self.BACKEND_ADDRESS+"/movility/users/").json()
        return users

    def addRequestToDB(self, requestData):
        response = requests.post("http://"+self.BACKEND_ADDRESS+"/movility/requests/", json=requestData).json()
        return response


    def getRandomUserDNI(self):
        return self.usersDNIs[random.randint(0,len(self.usersDNIs)-1)]
    
    def getRandomOrigin(self):
        center = self.origins_list[random.randint(0,len(self.origins_list)-1)]
        #print("CENTER -> %s , %s" % (center[1],center[0]))
        return self.generateNewCoordinatesByGaussDistribution(center)
    
    def getRandomDestination(self):
        center = self.destinations_list[random.randint(0,len(self.destinations_list)-1)]
        return self.generateNewCoordinatesByGaussDistribution(center) if self.random_destination else center

    def getNextPickupDatetime(self):
        dt = self.pickup_datetime
        while True:
            yield dt
            dt = dt + timedelta(minutes=self.time_dispersion)
    
    def getNextDeliveryDatetime(self):
        dt = self.delivery_datetime
        while True:
            yield dt
            dt = dt + timedelta(minutes=self.time_dispersion)
    
    def generateNewCoordinatesByGaussDistribution(self,coordinates):
        new_lon = float(coordinates[0]) + random.gauss( 0 , 0.001*float(coordinates[2]) ) # +-0.00001 = 1 meter ¿?
        new_lat = float(coordinates[1]) + random.gauss( 0 , 0.001*float(coordinates[2]) ) # coorindates[2] -> gauss dispersion
        temp = self.getClosestStreet([new_lon,new_lat])
        #print("\t -> %s , %s" % (temp[1],temp[0]))
        return temp
    
    def getClosestStreet(self, coordinates):
        res = requests.get("https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=%s&lon=%s" % (coordinates[1], coordinates[0])).json()
        return [res["lon"],res["lat"]]


if __name__ == "__main__":

    parameters = {
        "BACKEND_ADDRESS":      BACKEND_ADDRESS,
        "groups_number":        10,
        "origins_list":         origins,
        "destinations_list":    destinations,
        "pickup_datetime":      "2020-04-21T22:00:00Z",
        "delivery_datetime":    "2020-04-21T23:00:00Z",
        "time_dispersion":      20,  # Minutes
        "random_destination":   False
    }

    reqSim = RequestsSimulator(
        parameters["BACKEND_ADDRESS"], 
        parameters["groups_number"], 
        parameters["origins_list"], 
        parameters["destinations_list"], 
        parameters["pickup_datetime"], 
        parameters["delivery_datetime"], 
        parameters["time_dispersion"],
        parameters["random_destination"],
    )

    for _ in range(20):
        reqsGroup = reqSim.createRequestsGroup()
        for req in reqsGroup:
            reqSim.addRequestToDB(req)