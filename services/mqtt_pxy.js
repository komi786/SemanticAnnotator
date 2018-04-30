/**
 * Created by Mac on 26/06/2017.
 */

const mqtt=require('mqtt');
var config  = require('../configFile');
var service=require('./notif')
var host='mqtt://'+mqttBroker;
var oneM2MResPath='/oneM2M/req'
var client = mqtt.connect(host);
client.on('connect', function ()
{
    console.log('--pxy_mqtt--',mqttBroker);
});
var mqttsub= function ()
{
    client.subscribe(oneM2MResPath+cseid+'/'+mqtt_topic+'/json');

}
client.on('message', function (topic,message)
{
    //Parse notification message---Recieved MQTT notification
    console.log("notification message",topic);
    var data = JSON.parse(message);
    service.notificationHandling(data)  //Parse Payload
});
module.exports.subscibeTopic=mqttsub;
