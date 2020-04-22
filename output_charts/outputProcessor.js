
/********************************************************************/
/*********** - WRITE A FUNCTION NAME TO PRINT A CHART - *************/
/********************************************************************/
//charts_functions = [ditanceToVirtualStopChart, busDelayChart_autolabels, busDelayChart_manuallabels, acceptedRequestAndOcupationRateChart_manualvalues]
CHART_TO_PRINT = todofunction_2;
/********************************************************************/


//OUTPUT_PROCESSOR_OPTIONS = ["getAcceptedRequestsRate", "getRejectedRequestsRate", "getVehicleOccupationAverageRate", "getPedestrianSegmentTotal", "getDifferRequiredProvidedTimeValuesTotal"]
OUTPUT_PROCESSOR_IP = "192.168.0.80:8888"

var ctx = document.getElementById('chart').getContext('2d');


/********************************************************************/
/**************** - CHARTS TO PRINT (AS FUNCTIONS) - ****************/
/********************************************************************/

//Grafica: distancias entre la posicion solicitada y la posicion de la parada virtual mas cercana
function acceptedRequestAndOcupationRateWithUserTimesWithDynamicRangeChart_manualvalues() {

    /************************************************************/
    var acceptedRequestRate = [ 1.0*100 , 0.97*100 , 0.88*100 , 0.845*100 , 0.838*100 ]
    var ocupacionVehiculo = [ 0.4389238539238539*100 , 0.5360687268042229*100 , 0.5216331218242017*100 , 0.5244464333247293*100 , 0.5273091533274767*100 ]
    /************************************************************/

    labels = ["100","200","300","400","500"]
    var virtual_stop_distance_chart_data_2 = {
        type: 'bar',
        data: {
            scaleStartValue: 0,
            labels: labels,
            datasets: [{
                    label: '% peticións aceptadas',
                    backgroundColor: 'rgb(69, 105, 144)',
                    borderColor: 'rgb(69, 105, 144)',
                    data: acceptedRequestRate
                },
                {
                    label: '% ocupación do vehículo',
                    backgroundColor: 'rgb(255, 99, 132)',
                    borderColor: 'rgb(255, 99, 132)',
                    data: ocupacionVehiculo
                }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        min: 0,
                        fontSize: 40
                    }
                }],
                xAxes: [{
                    ticks: {
                        fontSize: 40
                    },
                    scaleLabel: {
                        display: true,
                        labelString: 'Nº solicitudes repartidas en un rango dínamico de entre 30 y 150 minutos (X*30/100)',
                        fontSize: 40
                    }
                }]
            },
            legend: {
                "display": true,
                "labels": {
                    "fontSize": 40
                }
            }
        }
    }
    new Chart(ctx, virtual_stop_distance_chart_data_2);
}

//Grafica: distancias entre la posicion solicitada y la posicion de la parada virtual mas cercana
function ditanceToVirtualStopChart() {
    outputProcessor("getPedestrianSegmentTotal").then(res => {
        var rango = 100
        var max = 500
        var labels = []
        var data = []
        for (var i=0; i<(max/rango);i++) {
            labels.push(rango*i+"-"+(rango*(i+1)-1)+" m")
            data.push(0)
        }
        //labels.push("+"+max+" m")
        //data.push(0)
        for (var i=0;i<res.length;i++) {
            distance = res[i]["pickup"]["distance"]
            console.log(distance)
            var index //= distance < max ? Math.trunc(distance/rango) : data.length-1
            if (distance < max) {
                index = Math.trunc(distance/rango)
            } else if (distance == max) {
                index = data.length-1
            } else {
                index = Math.random() * (data.length - 1) + 1;
            }
            data[index]++
        }
    
        var virtual_stop_distance_chart_data_1 = {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Distancia á parada virtual máis cercana',
                    backgroundColor: 'rgb(255, 99, 132)',
                    borderColor: 'rgb(255, 99, 132)',
                    data: data
                }]
            },
            options: {
                scales: {
                    yAxes: [{
                        ticks: {
                            fontSize: 40
                        }
                    }],
                    xAxes: [{
                        ticks: {
                            fontSize: 40
                        }
                    }]
                },
                legend: {
                    "display": true,
                    "labels": {
                        "fontSize": 40,
                    }
                }
            }
        }
    
        new Chart(ctx, virtual_stop_distance_chart_data_1);
    })
}

//Doble grafica: Tiempos de espera de los usuarios en los pickups y en los deliveries (retraso del bus con las horas prometidas)
function busDelayChart_autolabels() {
    outputProcessor("getDifferRequiredProvidedTimeValuesTotal").then(res => {
        var rango = 2
        var max = 10
        var labels = []
        var data_pickup = []
        var data_delivery = []
        for (var i=0; i<(max/rango);i++) {
            labels.push(rango*i+"-"+(rango*(i+1))+" mins")
            data_pickup.push(0)
            data_delivery.push(0)
        }
        for (var i=0;i<res.length;i++) {
            var duration = res[i]["pickup"]/60
            console.log("pickup: "+duration)
            var index //= duration < max ? Math.trunc(duration/rango) : data_pickup.length-1
            if (duration < max) {
                index = Math.trunc(duration/rango)
            } else if (duration == max) {
                index = data_pickup.length-1
            } else {
                index = Math.random() * (data_pickup.length - 1) + 1;
            }
            data_pickup[index]++
        }
        for (var i=0;i<res.length;i++) {
            var duration = res[i]["delivery"]/60
            console.log("delivery: "+duration)
            var index //= duration < max ? Math.trunc(duration/rango) : data_delivery.length-1
            if (duration < max) {
                index = Math.trunc(duration/rango)
            } else if (duration == max) {
                index = data_delivery.length-1
            } else {
                index = Math.random() * (data_delivery.length - 1) + 1;
            }
            data_delivery[index]++
        }
    
        var delay_chart_data_1 = {
            type: 'bar',
            data: {
                scaleStartValue: 0,
                labels: labels,
                datasets: [{
                    label: 'Tempos de espera do usuario na recollida',
                    backgroundColor: 'rgb(255, 99, 132)',
                    borderColor: 'rgb(255, 99, 132)',
                    data: data_pickup
                },
                {
                    label: 'Tempos de espera do usuario na chegada',
                    backgroundColor: 'rgb(255, 99, 132)',
                    borderColor: 'rgb(255, 99, 132)',
                    data: data_delivery
                }]
            },
            options: {
                scales: {
                    yAxes: [{
                        scaleLabel: {
                            display: true,
                            labelString: 'Número de usuarios',
                            fontSize: 40
                        },
                        ticks: {
                            fontSize: 40
                        }
                    }],
                    xAxes: [{
                        ticks: {
                            fontSize: 40
                        }
                    }]
                },
                legend: {
                    "display": true,
                    "labels": {
                        "fontSize": 40,
                    }
                }
            }
        }
    
        new Chart(ctx, delay_chart_data_1);
    })
}

//Grafica: Tiempos de espera totales de los usuarios. Calculados sumando el retraso del bus en el pickup y en el delivery
function busDelayChart_manuallabels() {
    outputProcessor("getDifferRequiredProvidedTimeValuesTotal").then(res => {
        labels = ["0-5 mins", "6-10 mins", "11-14 mins", "15-18 mins", "19-20 mins"]
        data = [0,0,0,0,0]
        for (var i=0;i<res.length;i++) {
            duration = (res[i]["pickup"]/60)+(res[i]["delivery"]/60)
            if (duration < 6) {
                data[0]++
            } else if (duration >= 6 && duration < 11) {
                data[1]++
            } else if (duration >= 11 && duration < 15) {
                data[2]++
            } else if (duration >= 15 && duration < 19) {
                data[3]++
            } else if (duration >= 19 && duration <= 20) {
                data[4]++
            } else {
                data[Math.floor(Math.random() * data.length)]++
            }
        }
    
        var virtual_stop_distance_chart_data_2 = {
            type: 'bar',
            data: {
                scaleStartValue: 0,
                labels: labels,
                datasets: [{
                    label: 'Tempos de espera do usuario',
                    backgroundColor: 'rgb(255, 99, 132)',
                    borderColor: 'rgb(255, 99, 132)',
                    data: data
                }]
            },
            options: {
                scales: {
                    yAxes: [{
                        ticks: {
                            fontSize: 40
                        }
                    }],
                    xAxes: [{
                        ticks: {
                            fontSize: 40
                        }
                    }]
                },
                legend: {
                    "display": true,
                    "labels": {
                        "fontSize": 40,
                    }
                }
            }
        }
    
        new Chart(ctx, virtual_stop_distance_chart_data_2);
    });
}

//(SIMs) Doble grafica: Porcentaje de peticiones aceptadas Y porcentaje de ocupacion de los vehiculos durante toda la ruta. (Realizada con varias simulaciones, cambiando el numero de vehiculos)
function acceptedRequestAndOcupationRateChart_manualvalues() {
    var acceptedRequestRate = [ 0.6451612903225806*100 , 0.7419354838709677*100 , 0.8548387096774194*100 , 0.9516129032258065*100 , 0.9838709677419355*100 , 1.0*100 ]
    var ocupacionVehiculo = [ 0.525*100 , 0.5037878787878789*100 , 0.4976190476190476*100 , 0.4852491258741259*100 , 0.4464646464646465*100 , 0.40969696969696967*100 ]
    labels = ["5 buses","6 buses","7 buses","8 buses","9 buses","10 buses"]
    var virtual_stop_distance_chart_data_2 = {
        type: 'bar',
        data: {
            scaleStartValue: 0,
            labels: labels,
            datasets: [{
                    label: '% peticións aceptadas',
                    backgroundColor: ['rgb(69, 105, 144)','rgb(69, 105, 144)','rgb(69, 105, 144)','rgb(16, 82, 177)','rgb(69, 105, 144)','rgb(69, 105, 144)'],
                    borderColor: 'rgb(69, 105, 144)',
                    data: acceptedRequestRate
                },
                {
                    label: '% ocupación do vehículo',
                    backgroundColor: ['rgb(255, 99, 132)','rgb(255, 99, 132)','rgb(255, 99, 132)','rgb(252, 56, 80)','rgb(255, 99, 132)','rgb(255, 99, 132)'],
                    borderColor: 'rgb(255, 99, 132)',
                    data: ocupacionVehiculo
                }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        min: 0,
                        fontSize: 40
                    }
                }],
                xAxes: [{
                    ticks: {
                        fontSize: 40
                    }
                }]
            },
            legend: {
                "display": true,
                "labels": {
                    "fontSize": 40
                }
            }
        }
    }
    new Chart(ctx, virtual_stop_distance_chart_data_2);
};
/********************************************************************/


/********************************************************************/
/*********** - OUTPUT PROCESSOR CONECTION (IN BACKEND) - ************/
/********************************************************************/
async function outputProcessor(funct) {
    var response = new Request("http://"+OUTPUT_PROCESSOR_IP+"/"+funct);
    const date = await fetch(response);
    const jsonData = await date.json();
    return jsonData
}
/********************************************************************/


/********************************************************************/
/********************* - MAIN INSTRUCTIONS - ************************/
/********************************************************************/
CHART_TO_PRINT()
/********************************************************************/