var express= require('express');
var app=express();
var bodyparser=require('body-parser');
var api=require('./services/api')
var service=require('./services/notif')
var asyncLoop = require('async');
app.use(bodyparser.json());
app.get('/',function(req,res)
{
   res.send('welcome');
});
app.get('/annotateResource/*',function(req,res)  //Subscribe Target entity and its all children entities for annotation
{
    var cse=csebase+'/';
    var rn = req.params[0];
    var tempaeid=rn.split('/');
    var subcnt=rn.replace(cse,'');

    try {
        tempaeid=tempaeid.slice(1,tempaeid.length);
        if (rn.includes('/'))
        {

            global.cnt = tempaeid[0];
            api.cnt(subcnt, function (response)
            {
                var m2mresources = JSON.parse(response)
                if (m2mresources['m2m:dbg'] == undefined)
                {
                    console.log('<------>')
                    var itemsProcessed = 0;
                    var uris = m2mresources["m2m:uril"];
                    var resource = uris.toString();
                    var splittogetlast = resource.split(',');
                    var rnparam = (cse + rn).toString()
                    splittogetlast.sort(function (arg1, arg2) {
                        return arg1.length - arg2.length
                    })
                    var count = 0;
                    asyncLoop.eachSeries(splittogetlast, function (item, next)
                    {
                        var temp = item.toString()
                        var splititem = temp.split('/');
                        service.csesubscription(temp);
                        next();
                    }, function (response, error)
                    {
                        res.send(m2mresources)
                    })
                    api.doTopicSubscription()
                }
                else
                {
                    res.send(m2mresources)
                }
            })
        }
        else
        {
            service.csesubscription(rn);
            res.send(rn);
        }
    }
    catch (error)
    {

        console.log(error)

    }

})
if(process.env.NODE_ENV !== 'n') {
    process.once('uncaughtException', function(err) {
        console.error('FATAL: Uncaught exception.');
        console.error(err.stack||err);
        setTimeout(function(){
            process.exit(1);
        }, 1000);
    });
}
app.listen(3000);
