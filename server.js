var got = require('got');
var express = require('express');
var fs = require('fs');
var request = require('request');
var path = require('path');
var cors = require('cors');
var app = express();
//app.set('view engine', 'ejs');

app.use(cors());

var jsonFileOptions = {
    root: path.join(__dirname)
};

class InitPaths {
    static gameFileNames(appid) {
        let fileNames = {};

        fileNames.fullGameJSON = "data/" + appid + "FullGameData.json";
        fileNames.infoJSON = "data/" + appid + "GameData.json";
        fileNames.newsJSON = "data/" + appid + "NewsData.json";
        fileNames.schemaJSON = "data/" + appid + "SchemaData.json";
        fileNames.achievJSON = "data/" + appid + "GlobalAchievData.json";
        fileNames.currentJSON = "data/" + appid + "CurrentData.json";
        return fileNames;
    }

    static gameURLs(appid, req) {
        let urls = {};
        urls.infoURL = 'http://store.steampowered.com/api/appdetails?appids=' + appid;
        urls.newsURL = 'http://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=' + appid + '&format=json';
        urls.schemaURL = 'https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?appid=' + appid + "&key=" + req.query.key;
        urls.achievURL = 'https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/?format=json&gameid=' + appid;
        urls.currentURL = 'https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?format=json&appid=' + appid;
        return urls;
    }


    static userFileNames(vanity) {
        let fileNames = {};
        fileNames.fullPlayerJSON = "data/" + vanity + "FullPlayerData.json";
        fileNames.infoJSON = "data/" + vanity + "Data.json"
        fileNames.bansJSON = "data/" + vanity + "Bans.json";
        fileNames.levelJSON = "data/" + vanity + "LevelData.json";
        fileNames.recentJSON = "data/" + vanity + "Recent.json";
        fileNames.badgesJSON = "data/" + vanity + "badgesData.json";
        fileNames.friendsJSON = "data/" + vanity + "FriendsData.json";
        fileNames.gameListJSON = "data/" + vanity + "GameList.json";
        fileNames.randGameJSON = "data/"+ vanity +"RandGame.json";
        return fileNames;
    }

    static userHeads(req){
        let urls = {};

        urls.infoHead = 'http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?format=json&key=' + req.query.key + '&steamids=';
        urls.bansHead = 'https://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?format=json&key=' + req.query.key + '&steamids=';
        urls.levelHead = 'https://api.steampowered.com/IPlayerService/GetSteamLevel/v1/?key=' + req.query.key + '&steamid=';
        urls.recentHead = 'http://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/?format=json&key=' + req.query.key + '&steamid=';
        urls.badgesHead = 'https://api.steampowered.com/IPlayerService/GetBadges/v1/?key=' + req.query.key + '&steamid=';
        urls.friendsHead = 'https://api.steampowered.com/ISteamUser/GetFriendList/v1/?format=json&key=' + req.query.key + '&steamid=';
        urls.gameListHead = 'http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?format=json&key=' + req.query.key + '&steamid=';

        return urls;
    }

    static userURLs(steamid, req) {

        let heads = this.userHeads(req);
        let urls=[];

        urls.infoURL = heads.infoHead + steamid;
        urls.bansURL = heads.bansHead + steamid;
        urls.levelURL = heads.levelHead + steamid;
        urls.recentURL = heads.recentHead + steamid;
        urls.badgesURL = heads.badgesHead + steamid;
        urls.friendsURL = heads.friendsHead + steamid;
        urls.gameListURL = heads.gameListHead + steamid;
        return urls;
    }


    static statsFileNames(vanity, appid) {
        let fileNames = {};
        fileNames.userStatsJSON = "data/" + vanity + appid + "UserStatsData.json";
        fileNames.statsJSON = "data/" + vanity + appid + "StatData.json";
        fileNames.achievJSON = "data/" + vanity + appid + "AchievData.json";
        return fileNames;
    }

    static statsHeads(appid, req){
        let urls = {};
        urls.userStatsHead = 'http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?format=json&appid=' + appid + '&key=' + req.query.key + '&steamid='
        return urls;
    }

    static statsURLs(steamid, appid, req) {
        let urls = {};

        urls.statsURL = 'http://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/?format=json&appid=' + appid + '&key=' + req.query.key + '&steamid=' + steamid;
        urls.achievURL = this.statsHeads(appid, req).userStatsHead + steamid;
        return urls;
    }

    static vanityUserURL(req, vanityUser) {
        return 'http://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=' + req.query.key + '&vanityurl=' + vanityUser + '&format=json'
    }

    static serverFiles(){
        let fileNames={}
        fileNames.appListJSON = "data/games.json"
        fileNames.undefinedJSON = "data/undefined.json"
        fileNames.pingJSON = "data/ping.json"
        return fileNames;
    }

    static staticURLs(){
        let urls={}
        urls.pingURL='https://api.steampowered.com/ISteamWebAPIUtil/GetServerInfo/v1/';
        urls.appListURL='https://api.steampowered.com/ISteamApps/GetAppList/v2/?format=json';
        return urls;
    }

}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function getRandomApp(apps){
    try {
        let randGameIndex = getRandomInt(apps.length - 1)
        return apps[randGameIndex]
    }catch (err){
        return apps[0]
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

function justWrite(object, jsonFileName) {
    //let data = JSON.parse(object)
    let jsonString = JSON.stringify(object);
    fs.writeFileSync(jsonFileName, jsonString);
}

function readFromJSONFile(jsonFileName){
    let fileContents = fs.readFileSync(jsonFileName, 'utf8')
    try {
        return JSON.parse(fileContents)
    } catch(err) {
        console.error(err)
    }
}

function deleteFile(filePath, reset = false, log = true){
    //console.log("deletefile: "+reset)
    if (filePath!==InitPaths.serverFiles().appListJSON && reset===false) {
        fs.unlink(filePath, function (err) {
            if (log) {
                if (err && err.code === 'ENOENT') {
                    // file doens't exist
                    console.info("File doesn't exist, won't remove it.");
                } else if (err) {
                    // other errors, e.g. maybe we don't have enough permission
                    console.info("Error occurred while trying to remove file");
                } else {
                    console.info("Removed: " + filePath);
                }
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
    let jsonFileName = InitPaths.serverFiles().undefinedJSON;
    res.sendFile(jsonFileName, jsonFileOptions, function (err) {
        if (err) {
            console.error(err);
        } else {
            console.log('Sent:', jsonFileName);
        }
    });
}

function sendJSONFile(jsonFileName, req, res, reset=false){
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

function sendFullGameFromID(appid, req, res){

    let fileNames=InitPaths.gameFileNames(appid);
    let urls=InitPaths.gameURLs(appid,req);

    writeToJSONFile(urls.infoURL,fileNames.infoJSON,req,res,function(jsonFileName, req, res){

        let infoData = readFromJSONFile(fileNames.infoJSON)
        deleteFile(fileNames.infoJSON)

        writeToJSONFile(urls.newsURL,fileNames.newsJSON,req,res,function(jsonFileName, req, res){
            let newsData = readFromJSONFile(fileNames.newsJSON)
            deleteFile(fileNames.newsJSON)

            writeToJSONFile(urls.schemaURL,fileNames.schemaJSON,req,res,function(jsonFileName, req, res){
                let schemaData = readFromJSONFile(fileNames.schemaJSON)
                deleteFile(fileNames.schemaJSON)

                writeToJSONFile(urls.achievURL,fileNames.achievJSON,req,res,function(jsonFileName, req, res){
                    let achievData = readFromJSONFile(fileNames.achievJSON)
                    deleteFile(fileNames.achievJSON)

                    writeToJSONFile(urls.currentURL,fileNames.currentJSON,req,res,function(jsonFileName, req, res){
                        let currentData = readFromJSONFile(fileNames.currentJSON)
                        deleteFile(fileNames.currentJSON)

                        let fullInfo={}
                        fullInfo.info=infoData
                        fullInfo.news=newsData
                        fullInfo.schema=schemaData
                        fullInfo.achiev=achievData
                        fullInfo.current=currentData

                        justWrite(fullInfo,fileNames.fullGameJSON)

                        sendJSONFile(fileNames.fullGameJSON,req, res)

                    });
                });
            });
        });
    });

}

async function getIDFromVanityUser(vanityUser, jsonFileName, urlHead, req, res, log=false) {

    let idUrl = InitPaths.vanityUserURL(req,vanityUser);

    let response = await got(idUrl, {json: true})
    let id=response.body.response.steamid;
    if(log) {
        console.log(vanityUser + " found; SteamID: " + id);
    }

    const myPromise = new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(id);
        }, 300);
    });
    return myPromise;
}

function sendFullUserFromID(steamid, vanity, req, res){


    let fileNames=InitPaths.userFileNames(vanity);
    let urls=InitPaths.userURLs(steamid,req);

    writeToJSONFile(urls.infoURL,fileNames.infoJSON,req,res,function(jsonFileName, req, res){

        let infoData = readFromJSONFile(fileNames.infoJSON)
        deleteFile(fileNames.infoJSON)

        writeToJSONFile(urls.bansURL,fileNames.bansJSON,req,res,function(jsonFileName, req, res){
            let bansData = readFromJSONFile(fileNames.bansJSON)
            deleteFile(fileNames.bansJSON)

            writeToJSONFile(urls.levelURL,fileNames.levelJSON,req,res,function(jsonFileName, req, res){
                let levelData = readFromJSONFile(fileNames.levelJSON)
                deleteFile(fileNames.levelJSON)

                writeToJSONFile(urls.recentURL,fileNames.recentJSON,req,res,function(jsonFileName, req, res){
                    let recentData = readFromJSONFile(fileNames.recentJSON)
                    deleteFile(fileNames.recentJSON)

                    writeToJSONFile(urls.badgesURL,fileNames.badgesJSON,req,res,function(jsonFileName, req, res){
                        let badgesData = readFromJSONFile(fileNames.badgesJSON)
                        deleteFile(fileNames.badgesJSON)

                        writeToJSONFile(urls.friendsURL,fileNames.friendsJSON,req,res,function(jsonFileName, req, res){
                            let friendsData = readFromJSONFile(fileNames.friendsJSON)
                            deleteFile(fileNames.friendsJSON)

                            writeToJSONFile(urls.gameListURL,fileNames.gameListJSON,req,res,function(jsonFileName, req, res){
                                let gameListData = readFromJSONFile(fileNames.gameListJSON)
                                deleteFile(fileNames.gameListJSON)

                                let fullInfo={}
                                fullInfo.info=infoData
                                fullInfo.bans=bansData
                                fullInfo.level=levelData
                                fullInfo.recent=recentData
                                fullInfo.badges=badgesData
                                fullInfo.friends=friendsData
                                fullInfo.gameList=gameListData

                                justWrite(fullInfo,fileNames.fullPlayerJSON)

                                sendJSONFile(fileNames.fullPlayerJSON,req, res)

                            });
                        });
                    });
                });
            });
        });
    });

}

function sendUserStatsFromAppid(appid, steamid, vanity, req, res){

    console.log(steamid)
    let fileNames=InitPaths.statsFileNames(vanity, appid);
    let urls=InitPaths.statsURLs(steamid, appid, req);

    writeToJSONFile(urls.statsURL,fileNames.statsJSON,req,res,function(jsonFileName, req, res){
        let statsData = readFromJSONFile(fileNames.statsJSON)
        deleteFile(fileNames.statsJSON)

        writeToJSONFile(urls.achievURL,fileNames.achievJSON,req,res,function(jsonFileName, req, res){
            let achievData = readFromJSONFile(fileNames.achievJSON)
            deleteFile(fileNames.achievJSON)

            let fullInfo={}
            fullInfo.stats=statsData
            fullInfo.achiev=achievData


            justWrite(fullInfo,fileNames.userStatsJSON)

            sendJSONFile(fileNames.userStatsJSON,req, res)
        });
    });

}


// deprecated: no longer needed
function sendGameFromID(appid, req, res) {

    let jsonFileName = "data/" + id + "GameData.json";
    let url = 'http://store.steampowered.com/api/appdetails?appids=' + id;
    writeToJSONFile(url, jsonFileName, req, res, function (jsonFileName, req, res) {
        sendJSONFile(jsonFileName, req, res)
    });
    //return jsonFileName

};
function deleteArrayOfPaths(fileNames){
    for(let i=0; i<fileNames.length; i++){
        deleteFile(fileNames[i])
    }
}

// Root

app.get('/', function(req, res) {

    let jsonFileName=InitPaths.serverFiles().pingJSON;
    let url = InitPaths.staticURLs().pingURL;
    //sendToJSONFile(url,jsonFileName,req, res);
    writeToJSONFile(url,jsonFileName,req,res,function(jsonFileName, req, res){
        sendJSONFile(jsonFileName,req, res)
    });


});


// User Calls

app.get('/user/:user', function(req, res) {
    let jsonFileName=InitPaths.userFileNames(req.params.user).infoJSON;
    let urlHead = InitPaths.userHeads(req).infoHead;

    getIDFromVanityUser(req.params.user, jsonFileName, urlHead, req, res)
        .then(value => { return (value); })
        .then(id => {
            writeToJSONFile(urlHead+id,jsonFileName,req,res,function(jsonFileName, req, res){
                sendJSONFile(jsonFileName,req, res)
            });
        })
});

app.get('/user/:user/fullUser', function(req, res) {
    let vanity = req.params.user
    let jsonFileName=InitPaths.userFileNames(vanity).fullPlayerJSON;
    let urlHead = InitPaths.userHeads(req).infoHead;

    getIDFromVanityUser(req.params.user, jsonFileName, urlHead, req, res)
        .then(value => { return (value); })
        .then(id => {
            writeToJSONFile(urlHead+id,jsonFileName,req,res,function(jsonFileName, req, res){
                sendFullUserFromID(id, vanity, req, res)
            });
        })
});


// User Games Calls

app.get('/user/:user/games', function(req, res) {
    let vanity = req.params.user
    let jsonFileName=InitPaths.userFileNames(vanity).gameListJSON;
    let urlHead = InitPaths.userHeads(req).gameListHead;

    getIDFromVanityUser(vanity, jsonFileName, urlHead, req, res)
        .then(value => { return (value); })
        .then(id => {
            writeToJSONFile(urlHead+id,jsonFileName,req,res,function(jsonFileName, req, res){
                sendJSONFile(jsonFileName,req, res)
            });
        })
});

app.get('/user/:user/games/rand', function(req, res) {
    let vanity = req.params.user
    let jsonFileName=InitPaths.userFileNames(vanity).randGameJSON;
    let urlHead = InitPaths.userHeads(req).gameListHead;

    getIDFromVanityUser(vanity, jsonFileName, urlHead, req, res)
        .then(value => { return (value); })
        .then(id => {
            writeToJSONFile(urlHead+id,jsonFileName,req,res,function(jsonFileName, req, res){
                let jsonFile = fs.readFileSync(jsonFileName);
                let apps = JSON.parse(jsonFile).response.games;

                if (apps!==undefined) {

                    let randApp = getRandomApp(apps)
                    deleteFile(jsonFileName)

                    sendFullGameFromID(randApp.appid, req, res)
                }
                else{
                    sendUndefined(req,res)
                    deleteFile(jsonFileName)
                }
            });
        })
});

app.get('/user/:user/games/:appid/userStats', function(req, res) {
    let vanity=req.params.user
    let appid=req.params.appid
    let jsonFileName=InitPaths.statsFileNames(vanity, appid).userStatsJSON;
    let urlHead = InitPaths.statsHeads(appid, req).userStatsHead

    getIDFromVanityUser(req.params.user, jsonFileName, urlHead, req, res)
        .then(value => { return (value); })
        .then(id => {
            writeToJSONFile(urlHead+id,jsonFileName,req,res,function(jsonFileName, req, res){
                sendUserStatsFromAppid(req.params.appid, id, req.params.user, req, res)
            });
        })
});


// App Info Calls

app.get('/apps', function(req, res) {
    let jsonFileName= InitPaths.serverFiles().appListJSON;
    let url = InitPaths.staticURLs().appListURL;
    writeToJSONFile(url,jsonFileName,req,res,function(jsonFileName, req, res){
        let reset=false
        if (req.query.reset==="true"){
            reset=true
        }
        //console.log("query: "+reset)
        sendJSONFile(jsonFileName,req, res,reset)
    });
});

app.get('/apps/rand', function(req, res) {
    let jsonFileName= InitPaths.serverFiles().appListJSON;
    let url = InitPaths.staticURLs().appListURL;
    writeToJSONFile(url,jsonFileName,req,res,function(jsonFileName, req, res){
        let jsonFile = fs.readFileSync(jsonFileName);
        let apps = JSON.parse(jsonFile).applist.apps;

        let randApp=getRandomApp(apps)

        sendFullGameFromID(randApp.appid,req,res)
    });
});

app.get('/apps/:appid/infoFull', function(req, res) {

    sendFullGameFromID(req.params.appid, req, res,)

});


// deprecated: unnecessary calls, not updating them. if something in them breaks, whoops oh well

app.get('/apps/:appid/info', function(req, res) {
    let jsonFileName="data/"+req.params.appid+"GameData.json";
    let url = 'http://store.steampowered.com/api/appdetails?appids=' + req.params.appid;
    writeToJSONFile(url,jsonFileName,req,res,function(jsonFileName, req, res){
        sendJSONFile(jsonFileName,req, res)
    });
});

app.get('/apps/:appid/news', function(req, res) {
    let jsonFileName="data/"+req.params.appid+"NewsData.json";
    let url = 'http://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=' + req.params.appid + '&format=json';
    writeToJSONFile(url,jsonFileName,req,res,function(jsonFileName, req, res){
        sendJSONFile(jsonFileName,req, res)
    });
});

app.get('/apps/:appid/schema', function(req, res) {
    let jsonFileName="data/"+req.params.appid+"SchemaData.json";
    let url = 'https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?appid=' + req.params.appid + "&key=" +req.query.key;
    writeToJSONFile(url,jsonFileName,req,res,function(jsonFileName, req, res){
        sendJSONFile(jsonFileName,req, res)
    });
});

app.get('/apps/:appid/globalAchiev', function(req, res) {
    let jsonFileName="data/"+req.params.appid+"GlobalAchievData.json";
    let url = 'https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/?format=json&gameid=' + req.params.appid ;
    writeToJSONFile(url,jsonFileName,req,res,function(jsonFileName, req, res){
        sendJSONFile(jsonFileName,req, res)
    });
});

app.get('/apps/:appid/current', function(req, res) {
    let jsonFileName="data/"+req.params.appid+"CurrentData.json";
    let url = 'https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?format=json&appid=' + req.params.appid ;
    writeToJSONFile(url,jsonFileName,req,res,function(jsonFileName, req, res){
        sendJSONFile(jsonFileName,req, res)
    });
});


app.get('/user/:user/games/recent', function(req, res) {
    let jsonFileName="data/"+req.params.user+"Recent.json";
    let urlHead = 'http://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/?format=json&key=' + req.query.key + '&steamid='

    getIDFromVanityUser(req.params.user, jsonFileName, urlHead, req, res)
        .then(value => { return (value); })
        .then(id => {
            writeToJSONFile(urlHead+id,jsonFileName,req,res,function(jsonFileName, req, res){
                sendJSONFile(jsonFileName,req, res)
            });
        })
});

app.get('/user/:user/bans', function(req, res) {
    let jsonFileName="data/"+req.params.user+"BansData.json";
    let urlHead = 'https://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?format=json&key='+req.query.key+'&steamids=';

    getIDFromVanityUser(req.params.user, jsonFileName, urlHead, req, res)
        .then(value => { return (value); })
        .then(id => {
            writeToJSONFile(urlHead+id,jsonFileName,req,res,function(jsonFileName, req, res){
                sendJSONFile(jsonFileName,req, res)
            });
        })
});

app.get('/user/:user/friends', function(req, res) {
    let jsonFileName="data/"+req.params.user+"FriendsData.json";
    let urlHead = 'https://api.steampowered.com/ISteamUser/GetFriendList/v1/?format=json&key='+req.query.key+'&steamid=';

    getIDFromVanityUser(req.params.user, jsonFileName, urlHead, req, res)
        .then(value => { return (value); })
        .then(id => {
            writeToJSONFile(urlHead+id,jsonFileName,req,res,function(jsonFileName, req, res){
                sendJSONFile(jsonFileName,req, res)
            });
        })
});

app.get('/user/:user/level', function(req, res) {
    let jsonFileName="data/"+req.params.user+"LevelData.json";
    let urlHead = 'https://api.steampowered.com/IPlayerService/GetSteamLevel/v1/?key='+req.query.key+'&steamid=';

    getIDFromVanityUser(req.params.user, jsonFileName, urlHead, req, res)
        .then(value => { return (value); })
        .then(id => {
            writeToJSONFile(urlHead+id,jsonFileName,req,res,function(jsonFileName, req, res){
                sendJSONFile(jsonFileName,req, res)
            });
        })
});

app.get('/user/:user/badges', function(req, res) {
    let jsonFileName="data/"+req.params.user+"BadgesData.json";
    let urlHead = 'https://api.steampowered.com/IPlayerService/GetBadges/v1/?key='+req.query.key+'&steamid=';

    getIDFromVanityUser(req.params.user, jsonFileName, urlHead, req, res)
        .then(value => { return (value); })
        .then(id => {
            writeToJSONFile(urlHead+id,jsonFileName,req,res,function(jsonFileName, req, res){
                sendJSONFile(jsonFileName,req, res)
            });
        })
});


app.get('/user/:user/games/:appid/achiev', function(req, res) {
    let jsonFileName="data/"+req.params.user+"-"+req.params.appid+"AchievData.json";
    let urlHead = 'http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?format=json&appid=' + req.params.appid + '&key=' + req.query.key + '&steamid='

    getIDFromVanityUser(req.params.user, jsonFileName, urlHead, req, res)
        .then(value => { return (value); })
        .then(id => {
            writeToJSONFile(urlHead+id,jsonFileName,req,res,function(jsonFileName, req, res){
                sendJSONFile(jsonFileName,req, res)
            });
        })
});

app.get('/user/:user/games/:appid/stats', function(req, res) {
    let jsonFileName="data/"+req.params.user+"-"+req.params.appid+"StatData.json";
    let urlHead = 'http://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/?format=json&appid=' + req.params.appid + '&key=' + req.query.key + '&steamid='

    getIDFromVanityUser(req.params.user, jsonFileName, urlHead, req, res)
        .then(value => { return (value); })
        .then(id => {
            writeToJSONFile(urlHead+id,jsonFileName,req,res,function(jsonFileName, req, res){
                sendJSONFile(jsonFileName,req, res)
            });
        })
});


app.use('/static', express.static('public'));

var port = 4000;
var server_port = process.env.YOUR_PORT || process.env.PORT || 80;
var server_host = process.env.YOUR_HOST || '0.0.0.0';

app.listen(server_port, server_host, function() {
    console.log('Listening on port %d', server_port);
});
//console.log('Listening on port ' + port);