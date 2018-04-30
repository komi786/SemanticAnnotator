Semantic Annotator 
Semantic annotator is a web component that supports annotation of oneM2M resource in Mobius Server Platform. It currently supports smart parking and bus information system use case only.

#######################################################
Run commmand: node annotator
#######################################################
Ip Configuration :
-> open the configFil and specify corresponding Mobius Server and MQTT broker IP address.
-> semantic Descriptor resource name can be changed in "smd" variable.
#######################################################
Features:
-> Smart Parking and Bus Information Data annotation
Example:
http://localhost:3000/annotateResource/{csebase}/{target_resourceName}
 Anti-Features
 -It doesn't provide annotation of non subscribed resources
 -It only subscribed those resources created within running period of annotator. Such as it can subscribed iotParking container and sub container resource but does not subscribe all parkingSpot instance as well. For each resource subscription use single resource query of annotator as mentioned below.
 
#######################################################
SmartParking
For Single Resource Annotation
1. For Subscription and annotation of iotParking and all level sub children resources
parkingSpot,offStreetParking and onStreetParking
http://localhost:3000/annotateResource/Mobius/iotParking

Bus Information System
2.  For Subscription and annotation of bus information system and all level sub children resources
busLine,busEstimation and busStop http://localhost:3000/annotateResource/Mobius/busInformationsystem

---Resource will be subscribed in MQTT and <subscribeToresource> is created (if deosnot exit already)
---on recieving notification regarding new content Instance value, annotation will be added and update automatically.

#######################################################


