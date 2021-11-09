var got = require('got');
var express = require('express');
var fs = require('fs');
var request = require('request');
var path = require('path');
var app = express();
//app.set('view engine', 'ejs');

var jsonFileOptions = {
    root: path.join(__dirname)
};

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function deleteFile(filePath, reset = false){
    //console.log("deletefile: "+reset)
    if (filePath!=="data/games.json" && reset===false) {
        fs.unlink(filePath, function (err) {
            if (err && err.code === 'ENOENT') {
                // file doens't exist
                console.info("File doesn't exist, won't remove it.");
            } else if (err) {
                // other errors, e.g. maybe we don't have enough permission
                console.error("Error occurred while trying to remove file");
            } else {
                console.info("Removed: " + filePath);
            }
        });
    }
    if (reset===true){
        fs.unlink(filePath, function (err) {
            if (err && err.code === 'ENOENT') {
                // file doens't exist
                console.info("File doesn't exist, won't remove it.");
            } else if (err) {
                // other errors, e.g. maybe we don't have enough permission
                console.error("Error occurred while trying to remove file");
            } else {
                console.info("Removed: " + filePath);
            }
        });
    }
}

function sendUndefined(req, res){
    let jsonFileName = "data/undefined.json"
    res.sendFile(jsonFileName, jsonFileOptions, function (err) {
        if (err) {
            console.error(err);
        } else {
            console.log('Sent:', jsonFileName);
        }
    });
}

function sendTheFile(jsonFileName, req, res, reset=false){
    //console.log("sendthefile: "+reset)
    if (reset===false){
        res.sendFile(jsonFileName, jsonFileOptions, function (err) {
            if (err) {
                console.error(err);
            } else {
                console.log('Sent:', jsonFileName);
                deleteFile(jsonFileName, false)
            }
        });
    }
    else{
        res.sendFile(jsonFileName, jsonFileOptions, function (err) {
            if (err) {
                console.error(err);
            } else {
                console.log('Sent:', jsonFileName);
                deleteFile(jsonFileName, true)
            }
        });
    }

}

function writeToJSONFile(url, jsonFileName, req, res, action) {

    try {
        if (fs.existsSync(jsonFileName)===false) {
            request.get(url, function(error, steamHttpResponse, steamHttpBody) {
                try {
                    let data = JSON.parse(steamHttpBody);
                    let jsonString = JSON.stringify(data);

                    fs.writeFileSync(jsonFileName, jsonString);

                    action(jsonFileName, req, res)
                } catch(err){
                    sendUndefined(req,res);
                }

            })
        }
        else{
            action(jsonFileName, req, res)
        }
    } catch(err) {
        console.log(err)
    }

}


async function getIDfromVanityUser(vanityUser, jsonFileName, urlHead, req, res) {

    let idUrl = 'http://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=' + req.query.key + '&vanityurl='+vanityUser + '&format=json';

    let response = await got(idUrl, {json: true})
    let id=response.body.response.steamid;
    console.log(vanityUser+" found; SteamID: "+id);

    writeToJSONFile(urlHead+id,jsonFileName,req,res,function(jsonFileName, req, res){
        sendTheFile(jsonFileName,req, res)
    });}

async function getRandGameFromVanityUser(vanityUser, jsonFileName, urlHead, req, res) {

    let idUrl = 'http://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=' + req.query.key + '&vanityurl='+vanityUser + '&format=json';

    let response = await got(idUrl, {json: true})
    let id=response.body.response.steamid;
    console.log(vanityUser+" found; SteamID: "+id);

    // we have the id


    writeToJSONFile(urlHead+id,jsonFileName,req,res,function(jsonFileName, req, res){
        let jsonFile = fs.readFileSync(jsonFileName);
        let apps = JSON.parse(jsonFile).response.games;

        if (apps!==undefined) {

            let randApp = getRandomApp(apps)
            deleteFile(jsonFileName)

            sendGamefromID(randApp.appid, req, res)
        }
        else{
            sendUndefined(req,res)
            deleteFile(jsonFileName)
        }
    });}

app.get('/', function(req, res) {

    let jsonFileName="data/server.json";
    let url = 'https://api.steampowered.com/ISteamWebAPIUtil/GetServerInfo/v1/';
    //sendToJSONFile(url,jsonFileName,req, res);
    writeToJSONFile(url,jsonFileName,req,res,function(jsonFileName, req, res){
        sendTheFile(jsonFileName,req, res)
    });
});

app.get('/user/:user', function(req, res) {
    let jsonFileName="data/"+req.params.user+"Data.json";
    let urlHead = 'http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?format=json&key=' + req.query.key + '&steamids=';

    getIDfromVanityUser(req.params.user, jsonFileName, urlHead, req, res)
});


app.get('/user/:user/games/recent', function(req, res) {
    let jsonFileName="data/"+req.params.user+"Recent.json";
    let urlHead = 'http://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/?format=json&key=' + req.query.key + '&steamid='

    getIDfromVanityUser(req.params.user, jsonFileName, urlHead, req, res)
});

app.get('/user/:user/games/:appid/achiev', function(req, res) {
    let jsonFileName="data/"+req.params.user+"-"+req.params.appid+"AchievData.json";
    let urlHead = 'http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?format=json&appid=' + req.params.appid + '&key=' + req.query.key + '&steamid='

    getIDfromVanityUser(req.params.user, jsonFileName, urlHead, req, res)
});
app.get('/user/:user/games/:appid/stats', function(req, res) {
    let jsonFileName="data/"+req.params.user+"-"+req.params.appid+"StatData.json";
    let urlHead = 'http://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/?format=json&appid=' + req.params.appid + '&key=' + req.query.key + '&steamid='

    getIDfromVanityUser(req.params.user, jsonFileName, urlHead, req, res)
});

app.get('/user/:user/games', function(req, res) {
    let jsonFileName="data/"+req.params.user+"GameList.json";
    let urlHead = 'http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?format=json&key=' + req.query.key + '&steamid=';

    getIDfromVanityUser(req.params.user, jsonFileName, urlHead, req, res)
});

app.get('/user/:user/games/rand', function(req, res) {
    let jsonFileName="data/"+req.params.user+"RandGame.json";
    let urlHead = 'http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?format=json&key=' + req.query.key + '&steamid=';

    getRandGameFromVanityUser(req.params.user, jsonFileName, urlHead, req, res)
});

app.get('/user/:user/bans', function(req, res) {
    let jsonFileName="data/"+req.params.user+"BansData.json";
    let urlHead = 'https://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?format=json&key='+req.query.key+'&steamids=';

    getIDfromVanityUser(req.params.user, jsonFileName, urlHead, req, res)
});

app.get('/user/:user/friends', function(req, res) {
    let jsonFileName="data/"+req.params.user+"FriendsData.json";
    let urlHead = 'https://api.steampowered.com/ISteamUser/GetFriendList/v1/?format=json&key='+req.query.key+'&steamid=';

    getIDfromVanityUser(req.params.user, jsonFileName, urlHead, req, res)
});

app.get('/user/:user/level', function(req, res) {
    let jsonFileName="data/"+req.params.user+"LevelData.json";
    let urlHead = 'https://api.steampowered.com/IPlayerService/GetSteamLevel/v1/?key='+req.query.key+'&steamid=';

    getIDfromVanityUser(req.params.user, jsonFileName, urlHead, req, res)
});

app.get('/user/:user/badges', function(req, res) {
    let jsonFileName="data/"+req.params.user+"BadgesData.json";
    let urlHead = 'https://api.steampowered.com/IPlayerService/GetBadges/v1/?key='+req.query.key+'&steamid=';

    getIDfromVanityUser(req.params.user, jsonFileName, urlHead, req, res)
});

app.get('/apps', function(req, res) {
    let jsonFileName="data/games.json";
    let url = 'https://api.steampowered.com/ISteamApps/GetAppList/v2/?format=json';
    writeToJSONFile(url,jsonFileName,req,res,function(jsonFileName, req, res){
        let reset=false
        if (req.query.reset==="true"){
            reset=true
        }
        //console.log("query: "+reset)
        sendTheFile(jsonFileName,req, res,reset)
    });
});

app.get('/apps/:appid/info', function(req, res) {
    let jsonFileName="data/"+req.params.appid+"GameData.json";
    let url = 'http://store.steampowered.com/api/appdetails?appids=' + req.params.appid;
    writeToJSONFile(url,jsonFileName,req,res,function(jsonFileName, req, res){
        sendTheFile(jsonFileName,req, res)
    });
});

app.get('/apps/:appid/news', function(req, res) {
    let jsonFileName="data/"+req.params.appid+"NewsData.json";
    let url = 'http://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=' + req.params.appid + '&format=json';
    writeToJSONFile(url,jsonFileName,req,res,function(jsonFileName, req, res){
        sendTheFile(jsonFileName,req, res)
    });
});

app.get('/apps/:appid/schema', function(req, res) {
    let jsonFileName="data/"+req.params.appid+"SchemaData.json";
    let url = 'https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?appid=' + req.params.appid + "&key=" +req.query.key;
    writeToJSONFile(url,jsonFileName,req,res,function(jsonFileName, req, res){
        sendTheFile(jsonFileName,req, res)
    });
});

app.get('/apps/:appid/globalAchiev', function(req, res) {
    let jsonFileName="data/"+req.params.appid+"GlobalAchievData.json";
    let url = 'https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/?format=json&gameid=' + req.params.appid ;
    writeToJSONFile(url,jsonFileName,req,res,function(jsonFileName, req, res){
        sendTheFile(jsonFileName,req, res)
    });
});

app.get('/apps/:appid/current', function(req, res) {
    let jsonFileName="data/"+req.params.appid+"CurrentData.json";
    let url = 'https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?format=json&appid=' + req.params.appid ;
    writeToJSONFile(url,jsonFileName,req,res,function(jsonFileName, req, res){
        sendTheFile(jsonFileName,req, res)
    });
});

app.get('/apps/rand', function(req, res) {
    let jsonFileName="data/games.json";
    let url = 'https://api.steampowered.com/ISteamApps/GetAppList/v2/?format=json';
    writeToJSONFile(url,jsonFileName,req,res,function(jsonFileName, req, res){
        let jsonFile = fs.readFileSync(jsonFileName);
        let apps = JSON.parse(jsonFile).applist.apps;

        let randApp=getRandomApp(apps)

        sendGamefromID(randApp.appid,req,res)
    });
});

function getRandomApp(apps){
    try {
        let randGameIndex = getRandomInt(apps.length - 1)
        return apps[randGameIndex]
    }catch (err){
        return apps[0]
    }
}

function sendGamefromID(id, req, res){
    let jsonFileName="data/"+id+"GameData.json";
    let url = 'http://store.steampowered.com/api/appdetails?appids=' + id;
    writeToJSONFile(url,jsonFileName,req,res,function(jsonFileName, req, res){
        sendTheFile(jsonFileName,req, res)
    });
    //return jsonFileName
}

app.use('/static', express.static('public'));

var port = 4000;
var server = app.listen(port);
console.log('Listening on port ' + port);