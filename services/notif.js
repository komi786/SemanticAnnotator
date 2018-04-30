/**
 * Created by Mac on 16/09/2017.
 */

var api=require('./api');
var mqtt=require('./mqtt_pxy');
var config  = require('../configFile');
var dataStructureFile=require('./dataStructure');
var notif=function (parentResourcePath)
{
    var notificationContent=parentResourcePath['pc']['m2m:sgn'];
    try {
        if (notificationContent && (notificationContent['net']==3 || notificationContent['net']==4))
        {
            console.log("Notification =",notificationContent);
            var resourceName=getParentResourcePath(notificationContent['sur']);
            if (notificationContent['nev']['rep']['m2m:cnt'])   //Notif--New container have been created--Subscribe CNT--Make MQTT subscription
            {
                var newcnt = notificationContent['nev']['rep']['m2m:cnt'];
                var fullresourceName = resourceName + '/' + newcnt['rn'];
                api.Resourcesubscription(fullresourceName, function (response)
                {
                    var subscription_response=JSON.parse(response)

                    if(subscription_response['m2m:sub'])
                    {
                        console.log('<--'+fullresourceName+ ' subscribed sucessfully--->');
                        api.doTopicSubscription()
                    }

                })
            }
            else if(notificationContent['nev']['rep']['m2m:cin'])                //Notif--New contentInstance have been created. parse SMD and Update
            {
                var newcin=notificationContent['nev']['rep']['m2m:cin'];
                var resourceNameSplit=resourceName.split('/');
                var subscriptionresourceName=resourceNameSplit[resourceNameSplit.length-1];
                var prn=resourceNameSplit[3];
                var parentResourcePath=getParentResourcePath(resourceName);

                if(prn.toLowerCase()=="parkingspot")
                {
                    if (subscriptionresourceName=="info")
                    {
                        createDescription(newcin,prn,parentResourcePath);
                        var statusrootparent=parentResourcePath+'/status';
                        api.latestcin(statusrootparent,function (res)
                        {
                            if(res['m2m:cin'])
                            {
                                createDescription(res['m2m:cin'],prn,parentResourcePath)
                            }
                        })
                    }
                    else if(subscriptionresourceName=="status")
                    {
                        createDescription(newcin,prn,parentResourcePath);
                        var inforootparent=parentResourcePath+'/info';
                        api.latestcin(inforootparent,function (res)
                        {
                            console.log('---cin--',res)
                            if(res['m2m:cin']!=undefined)
                            {
                                var resm2mcin=res['m2m:cin']['con'];
                                res['m2m:cin']['con']=resm2mcin
                                createDescription(res['m2m:cin'],prn,parentResourcePath);
                            }

                        })
                    }
                }
                else if(prn.toLowerCase()=="offstreetparking")
                {
                    if (subscriptionresourceName=="info")
                    {
                        createDescription(newcin,prn,parentResourcePath);
                        var availableSpotNumrootparent=parentResourcePath+'/availableSpotNum';
                        api.latestcin(availableSpotNumrootparent,function (res)
                        {
                            if(res['m2m:dbg']==undefined) {
                                createDescription(res['m2m:cin'],prn,parentResourcePath)
                            }
                        })
                        var aggregateRatingrootparent=parentResourcePath+'/aggregateRating';
                        api.latestcin(aggregateRatingrootparent,function (res)
                        {
                            if(res['m2m:dbg']==undefined) {
                                createDescription(res['m2m:cin'],prn,parentResourcePath)
                            }
                        })
                    }
                    else if(subscriptionresourceName=="availableSpotNum")
                    {
                        createDescription(newcin, prn, parentResourcePath);
                        var inforootparent = parentResourcePath + '/info';
                        api.latestcin(inforootparent, function (res) {
                            if (res['m2m:dbg'] == undefined) {
                                createDescription(res['m2m:cin'], prn, parentResourcePath)
                            }
                        })
                        var aggregateRatingrootparent=parentResourcePath+'/aggregateRating';
                        api.latestcin(aggregateRatingrootparent,function (res)
                        {
                            if(res['m2m:dbg']==undefined) {
                                createDescription(res['m2m:cin'], prn,parentResourcePath)
                            }
                        })
                    }
                    else if(subscriptionresourceName=="aggregateRating")
                    {
                        createDescription(res['m2m:cin'], prn, parentResourcePath)
                        var inforootparent = parentResourcePath + '/info';
                        api.latestcin(inforootparent, function (res) {
                            if (res['m2m:dbg'] == undefined) {
                                createDescription(res['m2m:cin'], prn, parentResourcePath)
                            }
                        })
                        var availableSpotNumrootparent=parentResourcePath+'/availableSpotNum';
                        api.latestcin(availableSpotNumrootparent,function (res)
                        {
                            if(res['m2m:dbg']==undefined)
                            {
                                createDescription(res['m2m:cin'], prn,parentResourcePath)
                            }
                        })
                    }
                    else
                    {
                        createDescription(newcin,prn,parentResourcePath)
                    }
                }
                else if(prn.toLowerCase()=="onstreetparking")
                {
                    if (subscriptionresourceName=="info")
                    {
                        createDescription(newcin,prn,parentResourcePath);
                        var availableSpotNumrootparent=parentResourcePath+'/availableSpotNum';
                        api.latestcin(availableSpotNumrootparent,function (res)
                        {
                            if(res['m2m:dbg']==undefined)
                            {
                                createDescription(res['m2m:cin'],prn,parentResourcePath)
                            }
                        })

                    }
                    else if(subscriptionresourceName=="availableSpotNum")
                    {
                        createDescription(newcin,prn,parentResourcePath);
                        var inforootparent=parentResourcePath+'/info';
                        api.latestcin(inforootparent,function (res)
                        {
                            if(res['m2m:dbg']==undefined) {
                                createDescription(res['m2m:cin'], prn,parentResourcePath)
                            }
                        })
                    }
                }


            }

        }

    }
    catch (error)
    {
        console.log(error)
    }

}

var createDescription=function (cin,rpn,smdprnresource)
{
    // console.log(smdprnresource);

    api.semanticDescription(smdprnresource,function (str)
    {
        console.log('str--',str)
        var data=JSON.parse(str);
        if (data['m2m:smd'])
        {
            try
            {
                if(data['m2m:smd']['dsp'])
                {
                    var sd=data['m2m:smd']['dsp'];
                    sd= Base64.decode(sd);
                    var newSD=ParsingSDFILE(cin,rpn,sd);
                    if(newSD.toString()!=sd.toString())
                    {
                        api.Resourcesubscription(smdprnresource+'/'+smd,function (res)
                        {
                            if(res['m2m:smd'])
                            {
                                console.log(res['m2m:smd']['rn']+' is subscribed')
                            }

                        })
                        newSD=Base64.encode(newSD);
                        var form={'rn':smdprnresource,'dspt':newSD};
                        api.UpdateResourceAnnotation(form,function (res)
                        {
                            console.log('m2m:smd=',res);
                        })
                    }
                    else
                    {
                        console.log('No Change occured= '+Base64.encode(sd))
                    }
                }

            }
            catch (error){
                console.log(error)
            }

        }
        else
        {
            try
            {
                var dspt = makeDSPTOnStreetParking(rpn);
                var form = {'rn': smdprnresource, 'dsp': Base64.encode(dspt) };
                api.ResourceAnnotation(form, function (response)
                {


                     var res=response
                    if(res['m2m:smd'])
                    {


                        if(res['m2m:smd']['dsp'])
                        {
                            api.Resourcesubscription(smdprnresource+'/'+smd,function (res) {
                                if(res['m2m:smd'])
                                {
                                    console.log(res['m2m:smd']['rn']+' is subscribed')
                                }


                            })
                            var sd=res['m2m:smd']['dsp'];
                            sd= Base64.decode(sd);
                            var newSD=ParsingSDFILE(cin,rpn,sd);
                            newSD=Base64.encode(newSD);
                            var form={'rn':smdprnresource,'dspt':newSD};
                            api.UpdateResourceAnnotation(form,function (res)
                            {
                                console.log('m2m:smd=',res);
                            })

                        }

                    }


                })
            }
            catch (error)
            {
                console.log(error)
            }


        }
    })
}
var getParentResourcePath=function(sur)
{
    return sur.replace(/\/[^/]+$/g,'')
}
function squash(arr)
{
    var tmp = [];
    for(var i = 0; i < arr.length; i++){
        if(tmp.indexOf(arr[i]) == -1){
            tmp.push(arr[i]);
        }
    }
    return tmp;
}
var makeDSPTOnStreetParking=function(parent)
{

    var fs = require('fs');
    var dspt="";
    if (parent.toLowerCase()==("parkingSpot").toLowerCase())
    {
        var parkingSpotmodel  = fs.readFileSync('./model/smartparking/ParkingSpot.xml', 'utf-8');
        dspt=parkingSpotmodel;
        return dspt;
    }
    else if (parent.toLowerCase()==("onStreetParking").toLowerCase())
    {
        var parkingSpotmodel  = fs.readFileSync('./model/smartparking/OnStreetParking.xml', 'utf-8');
        dspt=parkingSpotmodel;
        return dspt;


    }
    else if (parent.toLowerCase()==("offStreetParking").toLowerCase())
    {
        var parkingSpotmodel  = fs.readFileSync('./model/smartparking/OffStreetParking.xml', 'utf-8');
        dspt=parkingSpotmodel;
        return dspt;

    }
    else if (parent.toLowerCase()==("busstop").toLowerCase())
    {
        var parkingSpotmodel  = fs.readFileSync('./model/busInformationSystem/busStop.xml', 'utf-8');
        dspt=parkingSpotmodel;
        return dspt;

    }
    else if (parent.toLowerCase()==("busline").toLowerCase())
    {
        var parkingSpotmodel  = fs.readFileSync('./model/busInformationSystem/busLine.xml', 'utf-8');
        dspt=parkingSpotmodel;
        return dspt;

    }
    else if (parent.toLowerCase()==("busestimation").toLowerCase())
    {
        var parkingSpotmodel  = fs.readFileSync('./model/busInformationSystem/busEstimation.xml', 'utf-8');
        dspt=parkingSpotmodel;
        return dspt;

    }
    else
    {
        dspt=""
        return dspt;
    }
}
function ParsingSDFILE(cinObject,rootParent,document) {
    var xmlDoc = document;
    var xmldom = require('xmldom');
    var DOMParser = xmldom.DOMParser;
    var semanticDescriptor = new DOMParser().parseFromString(xmlDoc, "text/xml"); //parsing xml
    var m2mcin = cinObject['con']
    var m2mcin_ct=cinObject['ct'];
    var resourceName = cinObject.rn.toLowerCase(); //getting out rn
    // var m2mcin = cinObject.con; //getting out cin
    try {
        console.log('rootObject=',rootParent)
        if (rootParent.toLowerCase() == "parkingspot")
        {

            if(m2mcin.type !=undefined || m2mcin['id'] != undefined ||m2mcin.name != undefined  || m2mcin.dateModified != undefined || m2mcin['category'] != undefined
                ||m2mcin['status'] != undefined  || m2mcin.refParkingSite != undefined ||   m2mcin.location != undefined)
            {
                if (m2mcin['name'] != undefined)
                {
                    parseNode(semanticDescriptor.getElementsByTagName("park:hasName")[0], semanticDescriptor, m2mcin['name'])
                }
                if (m2mcin['id'] != undefined) {
                    parseNode(semanticDescriptor.getElementsByTagName("park:hasId")[0], semanticDescriptor, m2mcin['id'])
                }
                if (m2mcin['type'] != undefined) {
                    parseNode(semanticDescriptor.getElementsByTagName("park:hasType")[0], semanticDescriptor, m2mcin['type'])

                }
                if (m2mcin['status'] != undefined)
                {
                    parseNode(semanticDescriptor.getElementsByTagName("park:hasStatusValue")[0], semanticDescriptor, m2mcin['status'])
                    var datestring=new Date().toISOString()
                    parseNode(semanticDescriptor.getElementsByTagName("park:hasStatusTimeStamp")[0], semanticDescriptor, datestring)
                }
                if (m2mcin['dateModified'] != undefined) {
                    parseNode(semanticDescriptor.getElementsByTagName("park:hasDateModified")[0], semanticDescriptor, m2mcin_ct)
                }

                if (m2mcin['category'] != undefined)
                {
                    console.log('category')
                    if(typeof m2mcin['category'] =="object" )
                    {
                        var ln = m2mcin['category'].length;
                        var cat=m2mcin['category']
                        if (ln != semanticDescriptor.getElementsByTagName("park:hasCategory").length)
                        {
                            clearNodes("park:hasCategory", semanticDescriptor);
                            createNode("park:hasCategory", semanticDescriptor, ln, "string", "park:ParkingSpot", true)
                        }
                        var nodes = semanticDescriptor.getElementsByTagName("park:hasCategory");
                        for (var i = 0; i <ln; i++)
                        {
                            parseNode(nodes[i], semanticDescriptor, cat[i])

                        }
                    }
                    else
                    {
                        clearNodes("park:hasCategory", semanticDescriptor);
                        createNode("park:hasCategory", semanticDescriptor, 1, "string", "park:ParkingSpot", true)
                        parseNode(semanticDescriptor.getElementsByTagName("park:hasCategory")[0], semanticDescriptor, m2mcin['category'])
                    }
                }
                if (m2mcin['refParkingSite'] != undefined)
                {
                    if(typeof m2mcin['refParkingSite'] =="object" )
                    {
                        var ln = m2mcin['refParkingSite'].length;
                        clearNodes("park:hasRefParkingSite", semanticDescriptor);
                        createNode("park:hasRefParkingSite", semanticDescriptor, ln, "string", "park:ParkingSpot", true)
                        var nodes = semanticDescriptor.getElementsByTagName("park:hasRefParkingSite");
                        for (var i = 0; i < ln; i++) {
                            parseNode(nodes[i], semanticDescriptor, m2mcin['refParkingSite'][i])
                        }
                        var ParkingSpot = semanticDescriptor.getElementsByTagName("park:ParkingSpot")[0];
                        var newvalue = 'http://www.semanticweb.org/wise-iot/ontologies/2017/1/parkingOntology.owl#' + m2mcin['refParkingSite'][0];
                        updatenodeAtrribute(ParkingSpot, semanticDescriptor, "rdf:about", newvalue);
                    }
                    else
                    {
                        clearNodes("park:hasRefParkingSite", semanticDescriptor);
                        createNode("park:hasRefParkingSite", semanticDescriptor, 1, "string", "park:ParkingSpot", true)
                        parseNode(semanticDescriptor.getElementsByTagName("park:hasRefParkingSite")[0], semanticDescriptor, m2mcin['refParkingSite'])
                    }


                }
                if (m2mcin['location'] != undefined)
                {
                    var ln = m2mcin['location']['coordinates'].length;
                    clearNodes("park:hasLocation", semanticDescriptor);
                    createNode("park:hasLocation", semanticDescriptor, 1, "string", "park:ParkingSpot", false)
                    createNode("park:hasLocationType", semanticDescriptor, 1, "string", "park:hasLocation", true)
                    parseNode(semanticDescriptor.getElementsByTagName("park:hasLocationType")[0], semanticDescriptor, m2mcin['location']['type'])
                    if ( m2mcin['location']['coordinates'][0] instanceof Array)

                    {
                        for (var i = 0; i < ln; i++)
                        {
                            dictofNodeName = [["park:hasLongitude", "park:hasLatitude"], [true, true]]
                            literaldataTypesNestNodes = ["double", "double"]
                            createNestedNode(dictofNodeName, m2mcin['location']['coordinates'][i], "park:hasCoordinates", "park:hasLocation", semanticDescriptor, literaldataTypesNestNodes);
                        }
                    }
                    else
                    {
                        dictofNodeName = [["park:hasLongitude", "park:hasLatitude"], [true, true]]
                        literaldataTypesNestNodes = ["double", "double"]
                        if(m2mcin['location']['coordinates'] instanceof Array)
                        {
                            console.log('singleValue');
                            createNestedNode(dictofNodeName, m2mcin['location']['coordinates'], "park:hasCoordinates", "park:hasLocation", semanticDescriptor, literaldataTypesNestNodes);
                        }
                        else
                        {

                            var arr=m2mcin['location']['coordinates'].split(',');
                            createNestedNode(dictofNodeName,arr, "park:hasCoordinates", "park:hasLocation", semanticDescriptor, literaldataTypesNestNodes);

                        }
                    }


                }
                var newsmd = semanticDescriptor
                var XMLSerializer = xmldom.XMLSerializer;
                var newSD = new XMLSerializer().serializeToString(newsmd);
                return newSD

            }
            else if(typeof  m2mcin == 'string')
            {
                console.log('stringno=',m2mcin);
                parseNode(semanticDescriptor.getElementsByTagName("park:hasStatusValue")[0], semanticDescriptor, m2mcin)
                parseNode(semanticDescriptor.getElementsByTagName("park:hasStatusTimeStamp")[0], semanticDescriptor, m2mcin_ct)
                parseNode(semanticDescriptor.getElementsByTagName("park:hasDateModified")[0], semanticDescriptor, m2mcin_ct)
                var newsmd = semanticDescriptor
                var XMLSerializer = xmldom.XMLSerializer;
                var newSD = new XMLSerializer().serializeToString(newsmd);
                return newSD

            }
            else
            {
                return xmlDoc
            }


        }
        else if (rootParent.toLowerCase() == "onstreetparking") {
            if(m2mcin.type !=undefined || m2mcin['id'] != undefined ||m2mcin.name != undefined  || m2mcin.dateModified != undefined || m2mcin['category'] != undefined
                ||m2mcin['areBordersMarked'] != undefined  || m2mcin.allowedVehicleType != undefined || m2mcin.requiredPermit != undefined || m2mcin.chargeType != undefined
                || m2mcin['occupancyDetectionType'] != undefined||m2mcin.totalSpotNumber != undefined||m2mcin.refParkingSpot != undefined||m2mcin.availableSpotNumber != undefined||
                m2mcin.permitActiveHours != undefined ||  m2mcin.location != undefined)
            {
                if (m2mcin['type'] != undefined)
                {
                    console.log('type')
                    parseNode(semanticDescriptor.getElementsByTagName("park:hasType")[0], semanticDescriptor, m2mcin['type'])
                }
                if (m2mcin['id'] != undefined) {
                    console.log('id')
                    parseNode(semanticDescriptor.getElementsByTagName("park:hasId")[0], semanticDescriptor, m2mcin['id'])
                }
                if (m2mcin['name'] != undefined)
                {
                    console.log('name')
                    parseNode(semanticDescriptor.getElementsByTagName("park:hasName")[0], semanticDescriptor, m2mcin['name'])
                }
                if (m2mcin['dateModified'] != undefined)
                {
                    console.log('dateModified')
                    parseNode(semanticDescriptor.getElementsByTagName("park:hasDateModified")[0], semanticDescriptor, m2mcin_ct)
                }
                if (m2mcin['category'] != undefined)
                {
                    console.log('category')
                    if(typeof m2mcin['category'] =="object" )
                    {
                        var ln = m2mcin['category'].length;
                        var cat=m2mcin['category']
                        if (ln != semanticDescriptor.getElementsByTagName("park:hasCategory").length)
                        {
                            clearNodes("park:hasCategory", semanticDescriptor);
                            createNode("park:hasCategory", semanticDescriptor, ln, "string", "park:OnStreetParking", true)
                        }
                        var nodes = semanticDescriptor.getElementsByTagName("park:hasCategory");
                        for (var i = 0; i <ln; i++)
                        {


                            parseNode(nodes[i], semanticDescriptor, cat[i])

                        }
                    }
                    else
                    {
                        clearNodes("park:hasCategory", semanticDescriptor);
                        createNode("park:hasCategory", semanticDescriptor, 1, "string", "park:OnStreetParking", true)
                        parseNode(semanticDescriptor.getElementsByTagName("park:hasCategory")[0], semanticDescriptor, m2mcin['category'])
                    }

                }
                if (m2mcin['areBordersMarked'] != undefined)
                {
                    console.log('areBordersMarked');
                    parseNode(semanticDescriptor.getElementsByTagName("park:hasAreBordersMarked")[0], semanticDescriptor, m2mcin['areBordersMarked'])
                }
                if (m2mcin['allowedVehicleType'] != undefined)
                {
                    console.log('allowedVehicleType');
                    parseNode(semanticDescriptor.getElementsByTagName("park:hasAllowedVehicleType")[0], semanticDescriptor, m2mcin['allowedVehicleType'])
                }
                if (m2mcin['requiredPermit'] != undefined)
                {
                    console.log('requiredPermit');
                    var ln = m2mcin['requiredPermit'].length;
                    clearNodes("park:hasRequiredPermit", semanticDescriptor);
                    createNode("park:hasRequiredPermit", semanticDescriptor, ln, "string", "park:OnStreetParking", true)
                    var nodes = semanticDescriptor.getElementsByTagName("park:hasRequiredPermit");
                    for (var i = 0; i < nodes.length; i++) {
                        parseNode(nodes[i], semanticDescriptor, m2mcin['requiredPermit'][i])
                    }
                }
                if (m2mcin['chargeType'] != undefined)
                {
                    console.log('chargeType');
                    var ln = m2mcin['chargeType'].length;
                    clearNodes("park:hasChargeType", semanticDescriptor);
                    createNode("park:hasChargeType", semanticDescriptor, ln, "string", "park:OnStreetParking", true)
                    var nodes = semanticDescriptor.getElementsByTagName("park:hasChargeType");
                    for (var i = 0; i < nodes.length; i++) {
                        parseNode(nodes[i], semanticDescriptor, m2mcin['chargeType'][i])
                    }
                }
                if (m2mcin['occupancyDetectionType'] != undefined) {

                    console.log('occupancyDetectionType');
                    parseNode(semanticDescriptor.getElementsByTagName("park:hasOccupancyDetectionType")[0], semanticDescriptor, m2mcin['occupancyDetectionType'])
                }
                if (m2mcin['totalSpotNumber'] != undefined)
                {
                    console.log('totalSpotNumber='+m2mcin['totalSpotNumber']);
                    parseNode(semanticDescriptor.getElementsByTagName("park:hasTotalSpotNumber")[0], semanticDescriptor, m2mcin['totalSpotNumber'])
                }
                if (m2mcin['refParkingSpot'] != undefined)
                {
                    console.log('refParkingSpot');
                    var ln = m2mcin['refParkingSpot'].length;
                    clearNodes("park:hasRefParkingSpot", semanticDescriptor);
                    createNode("park:hasRefParkingSpot", semanticDescriptor, ln, "string", "park:onStreetParking", true)
                    var nodes = semanticDescriptor.getElementsByTagName("park:hasRefParkingSpot");
                    for (var i = 0; i < nodes.length; i++)
                    {
                        parseNode(nodes[i], semanticDescriptor, m2mcin['refParkingSpot'][i])
                    }
                    var offStreetNode = semanticDescriptor.getElementsByTagName("park:OnStreetParking")[0];
                    var newvalue = 'http://www.semanticweb.org/wise-iot/ontologies/2017/1/parkingOntology.owl#' + m2mcin['refParkingSpot'][0];
                    updatenodeAtrribute(offStreetNode, semanticDescriptor, "rdf:about", newvalue);


                }
                if (m2mcin['availableSpotNumber'] != undefined)
                {
                    console.log('availableSpotNumber');
                    var ln = m2mcin['availableSpotNumber'].length;
                    clearNodes("park:hasAvailableSpotNumber", semanticDescriptor);
                    var dictofNodeName = [["park:hasValueOfAvailableSpotNumber", "park:hasTimeStampOfAvailableSpotNumber"], [true, true]];
                    var literaldataTypesNestNodes = ["string", "string"]
                    if (typeof m2mcin['availableSpotNumber'][0] != "object")
                    {
                        for (var i = 0; i < ln; i++)
                        {
                            createNestedNode(dictofNodeName, m2mcin['availableSpotNumber'][i], "park:hasAvailableSpotNumber", "park:OnStreetParking", semanticDescriptor, literaldataTypesNestNodes);
                        }
                    }
                    else {
                        createNestedNode(dictofNodeName, m2mcin['availableSpotNumber'], "park:hasAvailableSpotNumber", "park:OnStreetParking", semanticDescriptor, literaldataTypesNestNodes);
                    }

                }
                if (m2mcin['permitActiveHours'] != undefined)                         //make rdf/xml class type for permitActiveHours sensor information
                {
                    var ln = m2mcin['permitActiveHours'].length;
                    clearNodes("park:hasPermiteActiveHours", semanticDescriptor);
                    var dictofNodeName = [["park:hasPropertyName", "park:hasPropertyValue"], [true, true]];
                    var literaldataTypesNestNodes = ["string", "string"]
                    if ( typeof m2mcin['permitActiveHours']=="object")
                    {
                        for (var i = 0; i < ln; i++)
                        {
                            var pactivehours=dictToArray(m2mcin['permitActiveHours'][i], 'y');
                            console.log('permitActiveHours=',pactivehours)
                            createNestedNode(dictofNodeName, pactivehours, "park:hasPermiteActiveHours", "park:OnStreetParking", semanticDescriptor, literaldataTypesNestNodes);
                        }
                    }

                }
                if (m2mcin['location'] != undefined)
                {
                    console.log('location');
                    var ln = m2mcin['location']['coordinates'].length;
                    clearNodes("park:hasCoordinates", semanticDescriptor);
                    parseNode(semanticDescriptor.getElementsByTagName("park:hasLocationType")[0], semanticDescriptor, m2mcin['location']['type'])
                    if (typeof m2mcin['location']['coordinates'][0] === "object")
                    {
                        for (var i = 0; i < ln; i++) {
                            dictofNodeName = [["park:hasLongitude", "park:hasLatitude"], [true, true]]
                            literaldataTypesNestNodes = ["double", "double"]
                            createNestedNode(dictofNodeName, m2mcin['location']['coordinates'][i], "park:hasCoordinates", "park:hasLocation", semanticDescriptor, literaldataTypesNestNodes);

                        }
                    }
                    else
                    {
                        dictofNodeName = [["park:hasLongitude", "park:hasLatitude"], [true, true]]
                        literaldataTypesNestNodes = ["double", "double"]
                        if(typeof m2mcin['location']['coordinates']==="string")
                        {
                            var arr=m2mcin['location']['coordinates'].split(',');
                            createNestedNode(dictofNodeName,arr, "park:hasCoordinates", "park:hasLocation", semanticDescriptor, literaldataTypesNestNodes);

                        }
                        else
                        {
                            createNestedNode(dictofNodeName, m2mcin['location']['coordinates'], "park:hasCoordinates", "park:hasLocation", semanticDescriptor, literaldataTypesNestNodes);
                        }
                        // createNestedNode(dictofNodeName, m2mcin['location']['coordinates'], "park:hasCoordinates", "park:hasLocation", semanticDescriptor, literaldataTypesNestNodes);
                    }
                }

                var XMLSerializer = xmldom.XMLSerializer;
                var newSD = new XMLSerializer().serializeToString(semanticDescriptor);
                return newSD
            }

            else
            {
                return xmlDoc
            }

        }
        else if (rootParent.toLowerCase() == "offstreetparking")
        {
            if (m2mcin.type != undefined || m2mcin['id'] != undefined || m2mcin.name != undefined || m2mcin.dateModified != undefined || m2mcin['category'] != undefined
                || m2mcin['areBordersMarked'] != undefined || m2mcin.allowedVehicleType != undefined || m2mcin.requiredPermit != undefined || m2mcin.chargeType != undefined
                || m2mcin.refParkingSpot != undefined || m2mcin.availableSpotNumber != undefined ||
                m2mcin.aggregateRating != undefined || m2mcin.location != undefined || m2mcin.contactPoint != undefined || m2mcin.openingHours != undefined)
            {
                if (m2mcin['name'] != undefined)
                {
                    parseNode(semanticDescriptor.getElementsByTagName("park:hasName")[0], semanticDescriptor, m2mcin['name'])
                }
                if (m2mcin['id'] != undefined) {
                    parseNode(semanticDescriptor.getElementsByTagName("park:hasId")[0], semanticDescriptor, m2mcin['id'])
                }
                if (m2mcin['type'] != undefined) {
                    console.log("type");
                    parseNode(semanticDescriptor.getElementsByTagName("park:hasType")[0], semanticDescriptor, m2mcin['type'])

                }
                if (m2mcin['refParkingSpot'] != undefined)
                {
                    console.log("refParkingSpot");
                    if (typeof m2mcin["refParkingSpot"] === "object")
                    {
                        var ln = m2mcin['refParkingSpot'].length;
                        clearNodes("park:hasRefParkingSpot", semanticDescriptor);
                        createNode("park:hasRefParkingSpot", semanticDescriptor, ln, "string", "park:OffStreetParking", true)
                        var nodes = semanticDescriptor.getElementsByTagName("park:hasRefParkingSpot");
                        for (var i = 0; i < nodes.length; i++) {
                            parseNode(nodes[i], semanticDescriptor, m2mcin['refParkingSpot'][i])
                        }
                        var offStreetNode = semanticDescriptor.getElementsByTagName("park:OffStreetParking")[0];
                        var newvalue = 'http://www.semanticweb.org/wise-iot/ontologies/2017/1/parkingOntology.owl#' + m2mcin['refParkingSpot'][0];
                        updatenodeAtrribute(offStreetNode, semanticDescriptor, "rdf:about", newvalue);
                    }
                    else
                    {
                        clearNodes("park:hasRefParkingSpot", semanticDescriptor);
                        createNode("park:hasRefParkingSpot", semanticDescriptor, 1, "string", "park:OffStreetParking", true)
                        var nodes = semanticDescriptor.getElementsByTagName("park:hasRefParkingSpot");
                        parseNode(nodes[i], semanticDescriptor, m2mcin['refParkingSpot'])
                        var offStreetNode = semanticDescriptor.getElementsByTagName("park:OffStreetParking")[0];
                        var newvalue = 'http://www.semanticweb.org/wise-iot/ontologies/2017/1/parkingOntology.owl#' + m2mcin['refParkingSpot'];
                        updatenodeAtrribute(offStreetNode, semanticDescriptor, "rdf:about", newvalue);

                    }


                }
                if (m2mcin['location'] != undefined) {
                    console.log("location");
                    var ln = m2mcin['location']['coordinates'].length;
                    clearNodes("park:hasCoordinates", semanticDescriptor);
                    // createNode("park:hasLocation",semanticDescriptor,1,"string","park:OffStreetParking",false)
                    // createNode("park:hasLocationType",semanticDescriptor,1,"string","park:hasLocation",true)
                    parseNode(semanticDescriptor.getElementsByTagName("park:hasLocationType")[0], semanticDescriptor, m2mcin['location']['type'])
                    if (typeof m2mcin['location']['coordinates'][0] === "object") {
                        // console.log("coordinatesss")
                        for (var i = 0; i < ln; i++) {
                            dictofNodeName = [["park:hasLongitude", "park:hasLatitude"], [true, true]]
                            literaldataTypesNestNodes = ["double", "double"]
                            createNestedNode(dictofNodeName, m2mcin['location']['coordinates'][i], "park:hasCoordinates", "park:hasLocation", semanticDescriptor, literaldataTypesNestNodes);

                        }
                    }
                    else {
                        dictofNodeName = [["park:hasLongitude", "park:hasLatitude"], [true, true]]
                        literaldataTypesNestNodes = ["double", "double"]
                        createNestedNode(dictofNodeName, m2mcin['location']['coordinates'], "park:hasCoordinates", "park:hasLocation", semanticDescriptor, literaldataTypesNestNodes);
                    }
                }
                if (m2mcin['availableSpotNumber'] != undefined) {
                    console.log("availableSpotNumber");
                    var ln = m2mcin['availableSpotNumber'].length;
                    clearNodes("park:hasAvailableSpotNumber", semanticDescriptor);
                    var dictofNodeName = [["park:hasValueOfAvailableSpotNumber", "park:hasTimeStampOfAvailableSpotNumber"], [true, true]];
                    var literaldataTypesNestNodes = ["string", "string"]
                    for (var i = 0; i < ln; i++) {
                        createNestedNode(dictofNodeName, m2mcin['availableSpotNumber'][i], "park:hasAvailableSpotNumber", "park:OffStreetParking", semanticDescriptor, literaldataTypesNestNodes);
                    }
                }
                if (m2mcin['contactPoint'] != undefined) {
                    console.log("contactPoint");
                    if (typeof m2mcin["contactPoint"] != "string")
                    {
                        var ln = m2mcin['contactPoint'].length;
                        clearNodes("park:hasContactPoint", semanticDescriptor);
                        var dictofNodeName = [["park:hasTelePhone", "park:hasContactType", "hasContactOption", "hasAreaServed"], [true, true, true, true]];
                        var literaldataTypesNestNodes = ["string", "string", "string", "string"]
                        for (var i = 0; i < ln; i++)
                        {
                            var valuedict = [m2mcin['contactPoint'][i], "customer service", "TollFree", "US"]
                            createNestedNode(dictofNodeName, valuedict, "park:hasContactPoint", "park:OffStreetParking", semanticDescriptor, literaldataTypesNestNodes);
                        }
                    }
                    else
                    {
                        clearNodes("park:hasContactPoint", semanticDescriptor);
                        var dictofNodeName = [["park:hasTelePhone", "park:hasContactType", "hasContactOption", "hasAreaServed"], [true, true, true, true]];
                        var literaldataTypesNestNodes = ["string", "string", "string", "string"]
                        var valuedict = [m2mcin['contactPoint'], "customer service", "TollFree", "US"]
                        createNestedNode(dictofNodeName, valuedict, "park:hasContactPoint", "park:OffStreetParking", semanticDescriptor, literaldataTypesNestNodes);

                    }

                }
                if (m2mcin['dateModified'] != undefined) {
                    console.log("dateModified");
                    parseNode(semanticDescriptor.getElementsByTagName("park:hasDateModified")[0], semanticDescriptor,m2mcin_ct)
                }
                if (m2mcin['openingHours'] != undefined)
                {
                    console.log("openingHours");
                    parseNode(semanticDescriptor.getElementsByTagName("park:hasOpeningHours")[0], semanticDescriptor, m2mcin['openingHours'])
                }
                if (m2mcin['category'] != undefined)
                {
                    console.log("category");
                    var ln = m2mcin['category'].length;
                    clearNodes("park:hasCategory", semanticDescriptor);
                    createNode("park:hasCategory", semanticDescriptor, ln, "string", "park:OffStreetParking", true)
                    var nodes = semanticDescriptor.getElementsByTagName("park:hasCategory");
                    for (var i = 0; i < nodes.length; i++) {
                        parseNode(nodes[i], semanticDescriptor, m2mcin['category'][i])
                    }
                }
                if (m2mcin['refParkingSite'] != undefined) {
                    console.log("refParkingSite");
                    if (typeof m2mcin["refParkingSpot"] === "object") {
                        var ln = m2mcin['refParkingSite'].length;
                        clearNodes("park:hasRefParkingSite", semanticDescriptor);
                        createNode("park:hasRefParkingSite", semanticDescriptor, ln, "string", "park:OffStreetParking", true)
                        var nodes = semanticDescriptor.getElementsByTagName("park:hasRefParkingSite");
                        for (var i = 0; i < nodes.length; i++) {
                            parseNode(nodes[i], semanticDescriptor, m2mcin['refParkingSite'][i])
                        }

                    }
                    else {
                        clearNodes("park:hasRefParkingSite", semanticDescriptor);
                        createNode("park:hasRefParkingSite", semanticDescriptor, 1, "string", "park:OffStreetParking", true)
                        var nodes = semanticDescriptor.getElementsByTagName("park:hasRefParkingSite");
                        parseNode(nodes[i], semanticDescriptor, m2mcin['refParkingSite'])
                        var offStreetNode = semanticDescriptor.getElementsByTagName("park:OffStreetParking")[0];
                        var newvalue = 'http://www.semanticweb.org/wise-iot/ontologies/2017/1/parkingOntology.owl#' + m2mcin['refParkingSite'];
                        updatenodeAtrribute(offStreetNode, semanticDescriptor, "rdf:about", newvalue);
                    }
                }
                if (m2mcin['aggregateRating'] != undefined)
                {
                    console.log("aggregateRating");
                    if (typeof m2mcin['aggregateRating'] != "object") {

                        clearNodes("park:hasAggregatedRating", semanticDescriptor);
                        var dictofNodeName = [["park:hasBestRating", "park:hasRatingValue", "park:hasRatingCount"], [true, true, true]];
                        var literaldataTypesNestNodes = ["string", "string", "string"]
                        var dictValue = ["", m2mcin['aggregateRating'], ""]
                        createNestedNode(dictofNodeName, dictValue, "park:hasAggregatedRating", "park:OffStreetParking", semanticDescriptor, literaldataTypesNestNodes);

                    }
                    else {
                        var ln = m2mcin['aggregateRating'].length;
                        //length of Aggregated String
                        clearNodes("park:hasAggregatedRating", semanticDescriptor);
                        var dictofNodeName = [["park:hasBestRating", "park:hasRatingValue", "park:hasRatingCount"], [true, true, true]];
                        var literaldataTypesNestNodes = ["string", "string", "string"]
                        for (var i = 0; i < ln; i++) {
                            createNestedNode(dictofNodeName, m2mcin['aggregateRating'][i], "park:hasAggregatedRating", "park:OffStreetParking", semanticDescriptor, literaldataTypesNestNodes);
                        }
                    }
                }
                if (m2mcin['requiredPermit'] != undefined) {
                    console.log("requiredPermit");
                    var ln = m2mcin['requiredPermit'].length;
                    clearNodes("park:hasRequiredPermit", semanticDescriptor);
                    createNode("park:hasRequiredPermit", semanticDescriptor, ln, "string", "park:OffStreetParking", true)
                    var nodes = semanticDescriptor.getElementsByTagName("park:hasRequiredPermit");
                    for (var i = 0; i < nodes.length; i++) {
                        parseNode(nodes[i], semanticDescriptor, m2mcin['requiredPermit'][i])
                    }
                }
                var newsmd = semanticDescriptor
                var XMLSerializer = xmldom.XMLSerializer;
                var newSD = new XMLSerializer().serializeToString(newsmd);
                return newSD
            }
            else
            {
                return xmlDoc;
            }


        }
        else if(rootParent.toLowerCase()=="busstop") {
            if(m2mcin.type !=undefined || m2mcin['id'] != undefined ||m2mcin.name != undefined  || m2mcin.refBuses != undefined || m2mcin['shortId'] != undefined
                ||m2mcin['busStopCount'] != undefined  || m2mcin.address != undefined ||   m2mcin.location != undefined ||m2mcin.direction != undefined||
                m2mcin.refBusLines != undefined ||m2mcin.dateModified != undefined)
            {

                if (m2mcin['name'] != undefined ) {
                    parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasName")[0], semanticDescriptor, m2mcin['name'])
                }
                if (m2mcin['id'] != undefined) {
                    parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasId")[0], semanticDescriptor, m2mcin['id'])
                }
                if (m2mcin['refBuses'] != undefined )
                {
                    var ln=m2mcin['refBuses'].length;
                    clearNodes("smartBus:hasRefBuses",semanticDescriptor);
                    createNode("smartBus:hasRefBuses",semanticDescriptor,ln,"string","smartBus:busStop",true)
                    var nodes=semanticDescriptor.getElementsByTagName("smartBus:hasRefBuses");
                    for(var i=0;i< nodes.length;i++)
                    {
                        parseNode(nodes[i],semanticDescriptor,m2mcin['refBuses'][i])
                    }
                }
                if (m2mcin['shortId'] != undefined ) {
                    parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasShortId")[0], semanticDescriptor, m2mcin['shortID'])
                }
                if (m2mcin['busStopCount'] != undefined )
                {
                    var ln=m2mcin['busStopCount'].length;
                    clearNodes("smartBus:hasBusStopCount",semanticDescriptor);
                    createNode("smartBus:hasBusStopCount",semanticDescriptor,ln,"string","smartBus:busStop",true)
                    var nodes=semanticDescriptor.getElementsByTagName("smartBus:hasBusStopCount");
                    for(var i=0;i< nodes.length;i++)
                    {
                        parseNode(nodes[i],semanticDescriptor,m2mcin['busStopCount'][i])
                    }
                }
                if (m2mcin['location'] != undefined ) {
                    parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasLatitude")[0], semanticDescriptor, m2mcin['location'][0])
                    parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasLongitude")[0], semanticDescriptor, m2mcin['location'][1])
                }
                if (m2mcin['address'] != undefined )
                {
                    parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasStreetAddress")[0], semanticDescriptor, m2mcin['address']['postalAddress']['streetAddress'])
                    parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasAddressLocality")[0], semanticDescriptor, m2mcin['address']['postalAddress']['addressLocality'])
                    parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasAddressRegion")[0], semanticDescriptor, m2mcin['address']['postalAddress']['addressRegion'])
                    parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasPostalCode")[0], semanticDescriptor, m2mcin['address']['postalAddress']['postalCode'])

                }
                if (m2mcin['direction'] != undefined )
                {
                    parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasDirection")[0], semanticDescriptor, m2mcin['direction'])
                }
                if (m2mcin['refBusLines'] != undefined )
                {
                    var ln=m2mcin['refBusLines'].length;
                    clearNodes("smartBus:hasRefBusLines",semanticDescriptor);
                    createNode("smartBus:hasRefBusLines",semanticDescriptor,ln,"string","smartBus:busStop",true)
                    var nodes=semanticDescriptor.getElementsByTagName("smartBus:hasRefBusLines");
                    for(var i=0;i< nodes.length;i++)
                    {
                        parseNode(nodes[i],semanticDescriptor,m2mcin['refBusLines'][i])
                    }
                }
                if (m2mcin['dateModified'] != undefined ) {
                    parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasDateModified")[0], semanticDescriptor, m2mcin_ct)
                }
                var newsmd = semanticDescriptor
                var XMLSerializer = xmldom.XMLSerializer;
                var newSD = new XMLSerializer().serializeToString(newsmd);
                return newSD
            }
            else
            {
                return xmlDoc
            }


        }
        else if(rootParent.toLowerCase()=="busline") {
            if(m2mcin.type !=undefined || m2mcin['id'] != undefined ||m2mcin.name != undefined  || m2mcin.refBuses != undefined || m2mcin['shortId'] != undefined
                ||m2mcin['intervalHoli'] != undefined  || m2mcin.refStartBusStop != undefined ||   m2mcin.startTime != undefined ||m2mcin.endTime != undefined||
                m2mcin.refBusStops != undefined ||m2mcin.dateModified != undefined || m2mcin.cin['intervalPeak'] != undefined
                || m2mcin.cin['intervalNorm'] != undefined )
            {
                if (m2mcin['id'] != undefined)
                {
                    parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasId")[0], semanticDescriptor, m2mcin['id'])
                }
                if (m2mcin['refBusStops'] != undefined)
                {
                    parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasRefBusStops")[0], semanticDescriptor, m2mcin['refBusStops'])
                }
                if (m2mcin['localId'] != undefined )
                {
                    parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasLocalId")[0], semanticDescriptor, m2mcin['localId'])
                }
                if (m2mcin['shortId'] != undefined) {
                    parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasShortId")[0], semanticDescriptor, m2mcin['shortId'])
                }
                if (m2mcin['name'] != undefined)
                {
                    parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasName")[0], semanticDescriptor, m2mcin['name'])
                }
                if (m2mcin['refStartBusStop'] != undefined)
                {
                    var ln=m2mcin['refStartBusStop'].length;
                    parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasRefStartBusStop")[0], semanticDescriptor, m2mcin['refStartBusStop'])   //StartBusStops is an string composed of string array
                }
                if (m2mcin['refEndBusStop'] != undefined)
                {

                    parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasRefEndBusStop")[0], semanticDescriptor, m2mcin['refEndBusStop']) //refEndBusStop is an string composed of string array
                }
                if (m2mcin['startTime'] != undefined )
                {
                    parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasStartTime")[0], semanticDescriptor, m2mcin['startTime'])
                }
                if (m2mcin['endTime'] != undefined)
                {
                    parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasEndTime")[0], semanticDescriptor, m2mcin['endTime'])
                }
                if (m2mcin['intervalNorm'] != undefined )
                {
                    parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasIntervalNorm")[0], semanticDescriptor, m2mcin['intervalNorm'])
                }
                if (m2mcin['intervalHoli'] != undefined )
                {
                    parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasIntervalHoli")[0], semanticDescriptor, m2mcin['intervalHoli'])
                }
                if (m2mcin['intervalPeak'] != undefined )
                {
                    parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasIntervalPeak")[0], semanticDescriptor, m2mcin['intervalPeak'])
                }

                if(m2mcin['datemodified'] != undefined )
                {
                    parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasDateModified")[0], semanticDescriptor, m2mcin_ct)
                }
                var newsmd = semanticDescriptor
                var XMLSerializer = xmldom.XMLSerializer;
                var newSD = new XMLSerializer().serializeToString(newsmd);
                return newSD
            }
            else
            {
                return xmlDoc
            }

        }
        else if(rootParent.toLowerCase()=="busestimation")
        {
            if(m2mcin['id'] != undefined  || m2mcin.refBusStop != undefined || m2mcin['refBusLine'] != undefined
                ||m2mcin['remainingDistances'] != undefined  || m2mcin.remainingTimes != undefined ||   m2mcin.shortId != undefined ||m2mcin.remainingStations != undefined||
                m2mcin.companyName != undefined ||m2mcin.dateModified != undefined || m2mcin.cin['location'] != undefined)
            {

                if (m2mcin['name'] != undefined )
                {
                    parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasName")[0], semanticDescriptor, m2mcin['name'])
                }
                if (m2mcin['id'] != undefined )
                {
                    parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasId")[0], semanticDescriptor, m2mcin['id'])
                }
                if (m2mcin['refBusStop'] != undefined )
                {
                    var ln=m2mcin['refBusStop'].length;
                    clearNodes("smartBus:hasRefBusStops",semanticDescriptor);
                    createNode("smartBus:hasRefBusStops",semanticDescriptor,ln,"string","smartBus:busEstimation",true)
                    var nodes=semanticDescriptor.getElementsByTagName("smartBus:hasRefBusStops");
                    for(var i=0;i< nodes.length;i++)
                    {
                        parseNode(nodes[i],semanticDescriptor,m2mcin['refBusStops'][i])
                    }
                }
                if (m2mcin['refBusLine'] != undefined )
                {
                    parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasRefBusLine")[0], semanticDescriptor, m2mcin['refBusLine'])
                }
                if (m2mcin['remainingDistances'] != undefined )
                {
                    var ln=m2mcin['remainingDistances'].length;
                    clearNodes("smartBus:hasRemainingDistances",semanticDescriptor);
                    createNode("smartBus:hasRemainingDistances",semanticDescriptor,ln,"string","smartBus:busEstimation",true)
                    var nodes=semanticDescriptor.getElementsByTagName("smartBus:hasRemainingDistances");
                    for(var i=0;i< nodes.length;i++)
                    {
                        parseNode(nodes[i],semanticDescriptor,m2mcin['remainingDistances'][i])
                    }
                }

                if (m2mcin['remainingTimes'] != undefined )
                {
                    var ln=m2mcin['remainingTimes'].length;
                    clearNodes("smartBus:hasRemainingTimes",semanticDescriptor);
                    createNode("smartBus:hasRemainingTimes",semanticDescriptor,ln,"string","smartBus:busEstimation",true)
                    var nodes=semanticDescriptor.getElementsByTagName("smartBus:hasRemainingTimes");
                    for(var i=0;i< nodes.length;i++)
                    {
                        parseNode(nodes[i],semanticDescriptor,m2mcin['remainingTimes'][i])
                    }
                }
                if (m2mcin['destinationBusLines'] != undefined )
                {
                    var ln=m2mcin['destinationBusLines'].length;
                    clearNodes("smartBus:hasDestinationBusLines",semanticDescriptor);
                    createNode("smartBus:hasDestinationBusLines",semanticDescriptor,ln,"string","smartBus:busEstimation",true)
                    var nodes=semanticDescriptor.getElementsByTagName("smartBus:hasDestinationBusLines");
                    for(var i=0;i< nodes.length;i++)
                    {
                        parseNode(nodes[i],semanticDescriptor,m2mcin['destinationBusLines'][i])
                    }
                }
                if (m2mcin['shortId'] != undefined )
                {
                    parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasShortId")[0], semanticDescriptor, m2mcin['shortId'])
                }
                if (m2mcin['remainingStations'] != undefined ) {
                    parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasRemainingStations")[0], semanticDescriptor, m2mcin['remainingStations'])
                }
                if (m2mcin['companyName'] != undefined ) {
                    parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasCompanyName")[0], semanticDescriptor, m2mcin['companyName'])
                }
                if (m2mcin['location'] != undefined )
                {
                    parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasLatitude")[0], semanticDescriptor, m2mcin['location'][0])
                    parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasLongitude")[0], semanticDescriptor, m2mcin['location'][1])
                }
                if (m2mcin['dateModified'] != undefined )
                {
                    parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasDateModified")[0], semanticDescriptor, m2mcin_ct)
                }
                var newsmd = semanticDescriptor
                var XMLSerializer = xmldom.XMLSerializer;
                var newSD = new XMLSerializer().serializeToString(newsmd);
                return newSD
            }
            else
            {
                return xmlDoc
            }

        }
        else {
            return xmlDoc;
        }

    }
    catch(error)
    {
        console.log(error)
    }

}
function testJSON(text){
    try{
        JSON.parse(text);
        return true;
    }
    catch (error){
        return false;
    }
}
var dictToArray=function (obj,keyflag)
{
    var arr=[];
    for (var key in obj)
    {
        if (obj.hasOwnProperty(key))
        {
            if (keyflag=='y')
            {
                arr.push(key);
                arr.push(obj[key]);
            }
            else if(keyflag=='n')
            {
                arr.push(obj[key]);
            }
            else if(keyflag=='b')
            {
                arr.push(key);
            }

        }
    }
    return arr;

}
var parseNode=function(stem,xmlDoc,m2mcin)
{

    var  node=stem;
    if (node)
    {

        var textNode = node.childNodes[0];

        if (!textNode)
        {
            textNode = xmlDoc.createTextNode("");
            node.appendChild(textNode);
        }

        textNode.nodeValue = m2mcin;
        textNode.data = m2mcin.toString();
        //console.log(node)
        console.log(m2mcin );

    }
    else
    {
        console.log(' node  does not exist for value--'+m2mcin);
    }

}
var createNode=function(name,xmldocument,count,dataTypeofAttribute,parentNode,flag) {
    // createNode("park:hasChargeType",semanticDescriptor,ln,"string","park:OnStreetParking",true)
    var structure = dataStructureFile.rdfTypeScheme;
    for (var i = 0; i < count; i++)
    {
        var node = xmldocument.getElementsByTagName(parentNode)[0];
        if (node)
        {
            var element = xmldocument.createElement(name)
            if (element && flag == true)
            {
                var textNode = xmldocument.createTextNode("");
                element.appendChild(textNode);
                var att = xmldocument.createAttribute(structure.type);
                att.value = structure.values[dataTypeofAttribute];        // Set the value of the class attribute
                element.setAttributeNode(att)
            }
            xmldocument.getElementsByTagName(parentNode)[0].appendChild(element);
        }
    }
}
var  createNestedNode =function(dictofNodeName,valueDict,parentNode,rootNode,xmldoc,literaldataType,flag)
{
    var structure=dataStructureFile.rdfTypeScheme;
    var node=xmldoc.getElementsByTagName(rootNode)[0];
    var  parentelement = xmldoc.createElement(parentNode)

    if(parentelement)
    {
        try {
            for(var i=0;i<dictofNodeName[0].length;i++)
            {
                var item=dictofNodeName[0][i];
                var flag=dictofNodeName[1][i];
                console.log(item+"="+valueDict[i])
                var  element = xmldoc.createElement(item.toString())
                if (element!=undefined && flag==true)
                {
                    var  textNode = xmldoc.createTextNode("");
                    element.appendChild(textNode);
                    var att = xmldoc.createAttribute(structure.type);       // Create a "class" attribute
                    att.value = structure.values[literaldataType[i]];              // Set the value of the class attribute
                    element.setAttributeNode(att)
                    parentelement.appendChild(element);
                    parseNode(element,xmldoc,valueDict[i])
                }
            }
            xmldoc.getElementsByTagName(rootNode)[0].appendChild(parentelement);
        }
        catch (error)
        {
            console.log(error)
        }


    }
}
var clearNodes=function (name,xmlDoc)
{
    var ln=xmlDoc.getElementsByTagName(name).length;
    var node=xmlDoc.getElementsByTagName(name);
    for(var i=0;i<ln;i++)
    {
        var root=node[i];
        if (root)
        {
            root.parentNode.removeChild(root);
        }
    }
}
var removeWhitespace=function(xml)
{
    var loopIndex;
    for (loopIndex = 0; loopIndex < xml.childNodes.length; loopIndex++)
    {
        var currentNode = xml.childNodes[loopIndex];

        if (currentNode.nodeType == 1)
        {
            removeWhitespace(currentNode);
        }

        if (!(/\S/.test(currentNode.nodeValue)) && (currentNode.nodeType == 3))
        {
            xml.removeChild(xml.childNodes[loopIndex--]);
        }
    }

}
var updatenodeAtrribute=function (stem,xmlDoc,attribute,newValue)
{
    var  node=stem;
    //var att=node.getAttribute(attribute)
    if (node)
    {
        var textNode = node.childNodes[0];
        node.removeAttribute(attribute);
        var att = xmlDoc.createAttribute(attribute);       // Create a "class" attribute
        att.value = newValue                           // Set the value of the class attribute
        node.setAttributeNode(att)
        var att=node.getAttribute(attribute)
        //console.log("Attribute Value=",att)
        // if (!textNode)
        // {
        //     textNode = xmlDoc.createTextNode("");
        //     node.appendChild(textNode);
        //
        // }
        return node;
    }
}
var Base64 = {


    _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    encode: function(input) {
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;

        input = Base64._utf8_encode(input);

        while (i < input.length) {

            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }

            output = output + this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) + this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

        }
        return output;
    },


    decode: function(input) {
        var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;

        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

        while (i < input.length) {

            enc1 = this._keyStr.indexOf(input.charAt(i++));
            enc2 = this._keyStr.indexOf(input.charAt(i++));
            enc3 = this._keyStr.indexOf(input.charAt(i++));
            enc4 = this._keyStr.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output = output + String.fromCharCode(chr1);

            if (enc3 != 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
                output = output + String.fromCharCode(chr3);
            }

        }
        output = Base64._utf8_decode(output);
        return output;

    },

    _utf8_encode: function(string) {
        string = string.replace(/\r\n/g, "\n");
        var utftext = "";

        for (var n = 0; n < string.length; n++) {

            var c = string.charCodeAt(n);

            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if ((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }

        }

        return utftext;
    },

    _utf8_decode: function(utftext) {
        var string = "";
        var i = 0;
        var c =0;
        var c1 = 0;
        var c2=0;
        var c3=0;

        while (i < utftext.length) {

            c = utftext.charCodeAt(i);

            if (c < 128) {
                string += String.fromCharCode(c);
                i++;
            }
            else if ((c > 191) && (c < 224)) {
                c2 = utftext.charCodeAt(i + 1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            }
            else {
                c2 = utftext.charCodeAt(i + 1);
                c3 = utftext.charCodeAt(i + 2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }

        }

        return string;
    }

}

var splitResourceArray=function (array) {

    var newArray=[];
    var j=0;
    for(var item in array)
    {
        if (item.split('/').length<=3)
        {
            newArray[j++]=item;
        }
    }
    return newArray
}
var mobiusMqttsubscribe=function (rn)
{
    var notificationUrl = "mqtt://"+mqttBroker+'/'+mqtt_topic;
    api.checkResourcesubscription(rn, function (aes)
    {
        var subscriptionExists = (aes['m2m:sub']!==undefined);
        if(!subscriptionExists)
        {
            console.log('Subscription created with notification URL <'+notificationUrl+'>')
            api.Resourcesubscription(rn, function (sub)
            {
                console.log('sub='+sub);
               //mqtt.subscibeTopic();
            })
        }
        else
        {
            console.log('sub='+aes['m2m:sub']);
             //mqtt.subscibeTopic();
        }
    })
}
module.exports.csesubscription=mobiusMqttsubscribe
module.exports.splitArray=splitResourceArray
module.exports.notificationHandling=notif

