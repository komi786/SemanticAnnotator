/*
 * Serve JSON to our AngularJS client
 */

// For a real app, you'd make database requests here.
// For this example, "data" acts like an in-memory "database"
var config = {
    async:true
};
module.exports.semanticDescription = function (rn,callback)
{
    var containerName=rn
    var http = require('http');
    var str = '';
    var options = {
        host: serverIP,
        port: serverPort,
        path: containerName+"/"+smd,
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'X-M2M-RI': '12345',
            'X-M2M-Origin': 'SOrigin'
        }
    };
    var req = http.request(options, function (res)
    {
        res.on('data', function (body) {
            str += body;
        });
        res.on('end', function ()
        {
            console.log('semanticDescription--')
            return callback(str);
        });
    });
    req.end();
};
module.exports.cnt = function (rn,callback)
{
        var cse='/'+csebase;
        var http = require('http');
        var str = '';
        var options = {
            host: serverIP,
            port: serverPort,
            path: cse+'/'+rn+'?fu=1&ty=3&rcn=4',
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-M2M-RI': '12345',
                'X-M2M-Origin': 'SOrigin'

            }
        };
        var req = http.request(options, function (res) {

            res.on('data', function (body) {
                str += body;
            });
            res.on('end', function () {
                console.log('cnt--')
                return callback(str);
            });
        });
        req.end();
};



//------***Resource Subscription in oneM2M by Create subscribedToBe Resource of Given Resource***------

module.exports.Resourcesubscription = function (rn, callback)
{
       // var cse='/'+csebase;

        var containerName=(rn.charAt(0)=='/')? rn:'/'+rn;
        var request = require('request');
        request.post({
        headers:  {
            'Accept': 'application/json',
            'X-M2M-RI': '12345',
            'X-M2M-Origin': 'SOrigin',
            'Content-Type':"application/vnd.onem2m-res+json; ty=23"
        },
        url:'http://'+serverIP+':'+serverPort+containerName,
        body:
            JSON.stringify({"m2m:sub":
                {
                    "enc": {
                        "net": [3]
                    },
                    "nu":["mqtt://"+mqttBroker+'/'+mqtt_topic + '?ct=json'],
                    "nct": 2,
                    "rn":sub
                }
            })

    },function(error, response, body)
    {
        console.log('---Resourcesubscription--')
        callback(body);
    });
};
module.exports.ResourceAnnotation = function (req, callback)
{
    var containerName=req['rn'];
    var headers={
        'Accept': 'application/json',
        'X-M2M-RI': '12345',
        'X-M2M-Origin': 'SOrigin',
        'Content-Type':"application/vnd.onem2m-res+json; ty=24"
    };
    var request = require('request');
    request.post({
        headers: headers,
        url:'http://'+serverIP+':'+serverPort+containerName,
        body:
            JSON.stringify({"m2m:smd":
                {
                    "or" : "http://your.ref.address",
                    "dcrp" : "application/rdf+xml:1",
                    "dsp":req['dsp'],
                    "rn":smd
                }
            })

    },function(error, response, body)
    {
        console.log('---ResourceAnnotation--')
        callback(body);
    });
};
module.exports.checkcontainerExist = function (rn, callback)
{
    var containerName = rn
    var AEs='';
    var http = require('http');
    var options = {
        host: serverIP,
        port: serverPort,
        path: containerName,
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'X-M2M-RI': '12345',
            'X-M2M-Origin': 'SOrigin',

        }
    };
    var reqGet = http.request(options, function(response) {
        response.on('data', function(d)
        {
            AEs+=d;
        });
        response.on('end', function()
        {

            try {
                console.log('checkcontainerExist')
                return callback(AEs);
            }
            catch(error)
            {
                console.log(error)
                return callback(AEs);
            }

        });

    });
    reqGet.end();
    reqGet.on('error', function(e) {
        console.error(e);
    });
};

module.exports.UpdateResourceAnnotation = function (body, callback)
{
    var containerName=body['rn'];
    var dspt=body['dspt'];
    var AEs='';
    var headers={
        'Accept': 'application/json',
        'X-M2M-RI': '12345',
        'X-M2M-Origin': 'SOrigin',
        'Content-Type':"application/vnd.onem2m-res+json"
    };
    var request = require('request');
    request({
        headers: headers,
        url:'http://'+serverIP+':'+serverPort+containerName+"/"+smd,
        method:'PUT',
        body:
            JSON.stringify({"m2m:smd":
                {
                    "dsp":dspt
                }
            })

    },function(error, response, body)
    {
        try {
            console.log('UpdateResourceAnnotation_body--',body)
            callback(body)
        }
        catch(error)
        {
            console.log(error)
            callback(body)
        }

    });
};
module.exports.checkResourceAnnotation = function (rn, callback)
{
    var containerName = '/'+rn.replace(" ",'')+"/"+smd;
    var AEs='';
    var http = require('http');
    var options = {
        host: serverIP,
        port: serverPort,
        path: containerName,
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'X-M2M-RI': '12345',
            'X-M2M-Origin': 'SOrigin',

        }
    };
    var reqGet = http.request(options, function(response) {
        response.on('data', function(d)
        {
            AEs+=d;
        });
        response.on('end', function()
        {
            console.log('checkResourceAnnotation')
            callback(AEs);
        });

    });
    reqGet.end();
    reqGet.on('error', function(e) {
        console.error(e);
    });
};
module.exports.checkResourcesubscription = function (rn, callback)
{
    var containerName = '/'+rn.replace(" ",'')+'/'+sub
    var AEs='';
    var http = require('http');
    var options = {
        host: serverIP,
        port: serverPort,
        path: containerName,
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'X-M2M-RI': '12345',
            'X-M2M-Origin': 'SOrigin',

        }
    };

    var reqGet = http.request(options, function(response)
    {
        response.on('data', function(d)
        {
            AEs+=d;
        });
        response.on('end', function()
        {
            try {
                console.log('checkResourcesubscription')
                AEs=JSON.parse(AEs)
                callback(AEs);
            }
            catch(error)
            {
                console.log(error)
                callback(AEs)
            }

        });

    });
    reqGet.end();
    reqGet.on('error', function(e) {
        console.error(e);
    });
};
var colorDetails = [
    '#9ed1c7','#ced4ae','#dfc39f','#ced4ae','#9ed1c7','#eec900'
];
module.exports.doTopicSubscription=function ()
{
    var mqttclient  = require('./mqtt_pxy');
    // if (cnt.includes("+"))
    // {
    //     cnt=cnt.split("+").join("/");
    // }
    mqttclient.subscibeTopic();

}
//Latest contentInstance Retrival
module.exports.latestcin = function (rn,callback)
{
    var cse='/'+csebase;
    var http = require('http');
    var str = '';
    var options = {
        host: serverIP,
        port: serverPort,
        path: rn+'/latest',
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'X-M2M-RI': '12345',
            'X-M2M-Origin': 'SOrigin'

        }
    };
    var req = http.request(options, function (res) {

        res.on('data', function (body) {
            str += body;
        });
        res.on('end', function () {
            try {

                return callback(str);
            }
            catch(error)
            {
                console.log(error)
                return callback(str);
            }

        });
    });
    req.end();
};




