import config_with_yaml as config
import requests
import random
from datetime import datetime, timedelta
from data.placesListsForRequests import origins, destinations
from data.paradasVirtuales import paradasVirtualesFiltradas
cfg = config.load("config.yml")

BACKEND_ADDRESS= "%s:%s" % (cfg.getProperty("backend.ip"), cfg.getProperty("backend.service.port"))
OUTPUT_PROCESSOR_ADDRESS= "%s:%s" % (cfg.getProperty("backend.ip"), cfg.getProperty("backend.output-processor.port"))


##########################################################################
################### - BACKEND CONECTION FUNCTIONS - ######################
##########################################################################

def addRequestDB(requestData):
    response = requests.post("http://"+BACKEND_ADDRESS+"/movility/requests/", json=requestData).json()
    return response

def getUsersFromDB():
    users = requests.get("http://"+BACKEND_ADDRESS+"/movility/users/").json()
    return users

def deleteAllRequestsDB():
    global BACKEND_ADDRESS
    for req in requests.get("http://"+BACKEND_ADDRESS+"/movility/requests/").json():
        requests.delete("http://"+BACKEND_ADDRESS+"/movility/requests/%i" % req["id"])

def deleteAllVirtualStopsDB():
    global BACKEND_ADDRESS
    for stop in requests.get("http://"+BACKEND_ADDRESS+"/movility/stops/").json():
        requests.delete("http://"+BACKEND_ADDRESS+"/movility/stops/%i" % stop["id"])

def createBaseVirtualStopsDB():
    global BACKEND_ADDRESS
    for coords in paradasVirtualesFiltradas:
        json = dict()
        json["coordenadas"] = str(coords[1]) + "," + str(coords[0])
        requests.post("http://"+BACKEND_ADDRESS+"/movility/stops/",json=json)

def deleteAllRoutesDB():
    global BACKEND_ADDRESS
    for stop in requests.get("http://"+BACKEND_ADDRESS+"/movility/routes/").json():
        requests.delete("http://"+BACKEND_ADDRESS+"/movility/routes/%i" % stop["id"])
##########################################################################


##########################################################################
################## - REQUESTS SIMULATOR CLASS - ##########################
##########################################################################
class RequestsSimulator():

    def __init__(self, BACKEND_ADDRESS, origins_list, destinations_list, pickup_datetime_range, min_diff_delivery_pickup, max_diff_delivery_pickup, dispersion_destination=True):
        self.BACKEND_ADDRESS = BACKEND_ADDRESS

        self.origins_list = origins_list
        self.destinations_list = destinations_list
        self.pickup_datetime_range = [datetime.strptime(pickup_datetime_range[0],f'%Y-%m-%dT%H:%M:%SZ'),datetime.strptime(pickup_datetime_range[1],f'%Y-%m-%dT%H:%M:%SZ')]
        self.dispersion_destination = dispersion_destination
        self.min_diff_delivery_pickup = min_diff_delivery_pickup
        self.max_diff_delivery_pickup = max_diff_delivery_pickup

        self.pickupDatetimeGenerator = self.getNextPickupDatetime()
        self.usersDNIs = [user["dni"] for user in getUsersFromDB()]
    

    def createRequestsGroup(self, groups_number, updb=False):
        requests = []
        responses = []
        pickupDatetime = next(self.pickupDatetimeGenerator)
        deliveryDatetime = self.getDestinationDatetimeFromPickup(pickupDatetime)
        for _ in range(groups_number):
            user = self.getRandomUserDNI()
            origin = self.getRandomOrigin()
            destination = self.getRandomDestination()
            pickupDatetime = pickupDatetime
            deliveryDatetime = deliveryDatetime
            requests.append(self.createRequestData(user, origin, destination, pickupDatetime, deliveryDatetime))
        if updb:
            responses = [addRequestDB(req) for req in requests]
        return {"requests":requests,"responses":responses}

    def createRequestData(self, user, origin, destination, pickupDatetime, deliveryDatetime):
        data = {
            "usuario":user,
            "origen":"%s,%s" % (origin[0],origin[1]),
            "destino":"%s,%s" % (destination[0],destination[1]),
            "fechaHoraSalida":pickupDatetime.strftime(f'%Y-%m-%dT%H:%M:%SZ'),
            "fechaHoraLlegada":deliveryDatetime.strftime(f'%Y-%m-%dT%H:%M:%SZ')
        }
        return data

    def getRandomUserDNI(self):
        return self.usersDNIs[random.randint(0,len(self.usersDNIs)-1)]
    
    def getRandomOrigin(self):
        center = self.origins_list[random.randint(0,len(self.origins_list)-1)]
        #print("CENTER -> %s , %s" % (center[1],center[0]))
        return self.generateNewCoordinatesByGaussDistribution(center)
    
    def getRandomDestination(self):
        center = self.destinations_list[random.randint(0,len(self.destinations_list)-1)]
        return self.generateNewCoordinatesByGaussDistribution(center) if self.dispersion_destination else center

    def getNextPickupDatetime(self):
        f_dt = self.pickup_datetime_range[0]
        s_dt = self.pickup_datetime_range[1]
        diff = s_dt.timestamp()-f_dt.timestamp()
        while True:
            yield (f_dt + timedelta(seconds=random.randint(0,diff)))
    
    def getDestinationDatetimeFromPickup(self, pickup_datetime):
        return (pickup_datetime + timedelta(minutes=random.randint(self.min_diff_delivery_pickup,self.max_diff_delivery_pickup)))
    
    def generateNewCoordinatesByGaussDistribution(self,coordinates):
        new_lon = float(coordinates[0]) + random.gauss( 0 , 0.001*float(coordinates[2]) ) # +-0.00001 = 1 meter ¿?
        new_lat = float(coordinates[1]) + random.gauss( 0 , 0.001*float(coordinates[2]) ) # coordinates[2] -> gauss dispersion
        temp = self.getClosestStreet([new_lon,new_lat])
        #print("\t -> %s , %s" % (temp[1],temp[0]))
        return temp
    
    def getClosestStreet(self, coordinates):
        res = requests.get("https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=%s&lon=%s" % (coordinates[1], coordinates[0])).json()
        return [res["lon"],res["lat"]]


##########################################################################
################## - CREATE REQUESTS FUNCTIONS - #########################
##########################################################################
def __dynamicTimeRangeInUsersRequests():

    parameters = {
        "BACKEND_ADDRESS":          BACKEND_ADDRESS,
        "origins_list":             origins,
        "destinations_list":        destinations,
        "pickup_datetime_range":    [
            [ "2020-04-22T10:00:00Z" , "2020-04-22T10:30:00Z" ],
            [ "2020-04-22T10:00:00Z" , "2020-04-22T11:00:00Z" ],
            [ "2020-04-22T10:00:00Z" , "2020-04-22T11:30:00Z" ],
            [ "2020-04-22T10:00:00Z" , "2020-04-22T12:00:00Z" ],
            [ "2020-04-22T10:00:00Z" , "2020-04-22T12:30:00Z" ],
        ],
        "min_diff_delivery_pickup": 30, # minutes
        "max_diff_delivery_pickup": 60,
        "dispersion_destination":   False
    }

    new_reqs = []
    for i, tests in enumerate([100,200,300,400,500]):
        reqSim = RequestsSimulator(
            parameters["BACKEND_ADDRESS"],
            parameters["origins_list"],
            parameters["destinations_list"],
            parameters["pickup_datetime_range"][i],
            parameters["min_diff_delivery_pickup"],
            parameters["max_diff_delivery_pickup"],
            parameters["dispersion_destination"],
        )
        print(" - %i requests - "%tests)
        print("\t deleting all requests in DB...")
        deleteAllRequestsDB()
        print("\t deleting all virtual stops in DB...")
        deleteAllVirtualStopsDB()
        print("\t creating base virtual stops in DB...")
        createBaseVirtualStopsDB()
        print("\t deleting all routes in DB...")
        deleteAllRoutesDB()
        print("\t starting to create the %i requests..."%tests)
        for _ in range(tests):
            new_reqs.append(reqSim.createRequestsGroup(1, updb=True)["requests"])
        print("\t requests created!")
        print("\t creating the routes...")
        response = requests.get("http://"+BACKEND_ADDRESS+"/movility/test/")
        print("\t routes created! Check the output_%i.json file in the backend"%i)
        print("\t\t backend response status --> %s"%response.status_code)
        #input("\nPress to continue...\n")
##########################################################################


##########################################################################
#################### - MAIN FUNCTION - ###################################
##########################################################################
if __name__ == "__main__":
    __dynamicTimeRangeInUsersRequests()
##########################################################################
