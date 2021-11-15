var got = require('got');
var express = require('express');
var fs = require('fs');
var request = require('request');
var path = require('path');
var cors = require('cors');
var app = express();
//app.set('view engine', 'ejs');

app.use(cors());

const jsonFileOptions = {
    root: path.join(__dirname)
};

var server_port = process.env.YOUR_PORT || process.env.PORT || 80;
var server_host = process.env.YOUR_HOST || '0.0.0.0';

const ts = Date.now();
let currentTime = new Date(ts).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }) + ' PST';

currentTime = replaceAll(currentTime,' ','-')
currentTime = replaceAll(currentTime,',','')


class InitPaths {

    static dataDir = 'data'
    static logDir = 'log'

    static jsonOptions(sign='&'){
        let language= 'english'
        let currency= 'us'
        let format = 'json'

        return `${sign}l=${language}&cc=${currency}&format=${format}`
    }

    static gameFileNames(appid) {
        let fileNames = {};

        fileNames.fullGameJSON = this.dataDir + '/' + appid + 'FullGameData.json';
        fileNames.infoJSON = this.dataDir + '/' + appid + 'GameData.json';
        fileNames.newsJSON = this.dataDir + '/' + appid + 'NewsData.json';
        fileNames.schemaJSON = this.dataDir + '/' + appid + 'SchemaData.json';
        fileNames.achievJSON = this.dataDir + '/' + appid + 'GlobalAchievData.json';
        fileNames.currentJSON = this.dataDir + '/' + appid + 'CurrentData.json';
        return fileNames;
    }

    static gameURLs(appid, req) {
        let urls = {};
        urls.infoURL = 'http://store.steampowered.com/api/appdetails?appids=' + appid + this.jsonOptions();
        urls.newsURL = 'http://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=' + appid + this.jsonOptions();
        urls.schemaURL = 'https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?appid=' + appid + '&key=' + req.query.key + this.jsonOptions();
        urls.achievURL = 'https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/?gameid=' + appid + this.jsonOptions();
        urls.currentURL = 'https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=' + appid + this.jsonOptions();
        return urls;
    }

    static featuredFileNames(){
        let fileNames={}
        fileNames.fullFeaturedJSON = this.dataDir + '/fullFeatured.json'
        fileNames.featuredJSON = this.dataDir + '/featured.json'
        fileNames.featuredCatsJSON = this.dataDir + '/featuredCats.json'
        return fileNames;
    }

    static userFileNames(vanity) {
        let fileNames = {};
        fileNames.fullPlayerJSON = this.dataDir + '/' + vanity + 'FullPlayerData.json';
        fileNames.infoJSON = this.dataDir + '/' + vanity + this.dataDir + '.json'
        fileNames.bansJSON = this.dataDir + '/' + vanity + 'Bans.json';
        fileNames.levelJSON = this.dataDir + '/' + vanity + 'LevelData.json';
        fileNames.recentJSON = this.dataDir + '/' + vanity + 'Recent.json';
        fileNames.badgesJSON = this.dataDir + '/' + vanity + 'badgesData.json';
        fileNames.friendsJSON = this.dataDir + '/' + vanity + 'FriendsData.json';
        fileNames.gameListJSON = this.dataDir + '/' + vanity + 'GameList.json';
        fileNames.randGameJSON = this.dataDir + '/'+ vanity +'RandGame.json';
        return fileNames;
    }

    static userHeads(req){
        let urls = {};

        urls.infoHead = 'http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=' + req.query.key + '&steamids=';
        urls.bansHead = 'https://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?key=' + req.query.key + '&steamids=';
        urls.levelHead = 'https://api.steampowered.com/IPlayerService/GetSteamLevel/v1/?key=' + req.query.key + '&steamid=';
        urls.recentHead = 'http://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/?key=' + req.query.key + '&steamid=';
        urls.badgesHead = 'https://api.steampowered.com/IPlayerService/GetBadges/v1/?key=' + req.query.key + '&steamid=';
        urls.friendsHead = 'https://api.steampowered.com/ISteamUser/GetFriendList/v1/?key=' + req.query.key + '&steamid=';
        urls.gameListHead = 'http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=' + req.query.key + '&steamid=';

        return urls;
    }

    static userURLs(steamid, req) {

        let heads = this.userHeads(req);
        let urls=[];

        urls.infoURL = heads.infoHead + steamid + this.jsonOptions();
        urls.bansURL = heads.bansHead + steamid + this.jsonOptions();
        urls.levelURL = heads.levelHead + steamid + this.jsonOptions();
        urls.recentURL = heads.recentHead + steamid + this.jsonOptions();
        urls.badgesURL = heads.badgesHead + steamid + this.jsonOptions();
        urls.friendsURL = heads.friendsHead + steamid + this.jsonOptions();
        urls.gameListURL = heads.gameListHead + steamid + this.jsonOptions();
        return urls;
    }


    static statsFileNames(vanity, appid) {
        let fileNames = {};
        fileNames.userStatsJSON = this.dataDir + '/' + vanity + appid + 'UserStatsData.json';
        fileNames.statsJSON = this.dataDir + '/' + vanity + appid + 'StatData.json';
        fileNames.achievJSON = this.dataDir + '/' + vanity + appid + 'AchievData.json';
        return fileNames;
    }

    static statsHeads(appid, req){
        let urls = {};
        urls.userStatsHead = 'http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?appid=' + appid + '&key=' + req.query.key + '&steamid='
        return urls;
    }

    static statsURLs(steamid, appid, req) {
        let urls = {};

        urls.statsURL = 'http://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/?appid=' + appid + '&key=' + req.query.key + '&steamid=' + steamid + this.jsonOptions();
        urls.achievURL = this.statsHeads(appid, req).userStatsHead + steamid + this.jsonOptions();
        return urls;
    }

    static vanityUserURL(req, vanityUser) {
        return 'http://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=' + req.query.key + '&vanityurl=' + vanityUser + this.jsonOptions();
    }

    static vanityUserFileName(steamid){
        return this.dataDir + '/'+steamid+'vanity.json'
    }

    static serverFiles(){
        let fileNames={}
        fileNames.appListJSON = this.dataDir + '/games.json'
        fileNames.undefinedJSON = this.dataDir + '/undefined.json'
        fileNames.pingJSON = this.dataDir + '/ping.json'
        fileNames.ipLog = this.logDir + '/ips.log'
        fileNames.consoleLog = this.logDir + '/console.log'
        fileNames.ignore=[fileNames.undefinedJSON, fileNames.pingJSON]
        return fileNames;
    }

    static staticURLs(){
        let urls={}
        urls.pingURL='https://api.steampowered.com/ISteamWebAPIUtil/GetServerInfo/v1/' + this.jsonOptions('?');
        urls.appListURL='https://api.steampowered.com/ISteamApps/GetAppList/v2/' + this.jsonOptions('?');
        urls.featuredURL='http://store.steampowered.com/api/featured/' + this.jsonOptions('?')
        urls.featuredCatsURL='http://store.steampowered.com/api/featuredcategories/' + this.jsonOptions('?')
        return urls;
    }

    static host(source = 'remote'){
        if (source==='local'){
            return `localhost:${server_port}`
        }
        else{
            return 'https://steam-tools-nickesc.herokuapp.com'
        }
    }


}

function replaceAll(string, search, replace) {
    return string.split(search).join(replace);
}

function writeLog(logLine, ip = null){
    //writeLog(logLine);
    let writeLine;
    if (ip){
        writeLine=`${currentTime} | ${ip} | ${logLine}\r\n`
    } else{
        writeLine=`${currentTime} | ${logLine}\r\n`
    }
    console.log(writeLine)

    fs.appendFileSync(InitPaths.serverFiles().consoleLog,writeLine)

}

function clearDir(directory){
    //const directory = 'test';
    const ignore = InitPaths.serverFiles().ignore

    fs.readdir(directory, (err, files) => {
        if (err) throw err;

        //writeLog(ignore)

        for (let file of files) {
            file=path.join(directory, file)

            if (ignore.includes(file)===false) {
                //writeLog(file)
                fs.unlink(file, err => {
                    if (err) throw err;
                });
                writeLog("Removed: "+file)
            }
        }
    });
}

function tryAddToJson(key, source, json){
    //
    try {
        json[key] = source[key]
        return true
    } catch (err){
        //writeLog(err)
        return false
    }
}

function simplifyInfo(app) {
    let simplifiedInfo = {

    }
    let temp={}


    temp.platforms={}
    temp.platforms.pc={}
    temp.platforms.mac={}
    temp.platforms.linux={}
    tryAddToJson("windows",app.platforms,temp.platforms.pc)
    tryAddToJson("mac",app.platforms,temp.platforms.mac)
    tryAddToJson("linux",app.platforms,temp.platforms.linux)

    temp.platforms.pc["available"]=temp.platforms.pc["windows"]
    delete temp.platforms.pc["windows"]
    temp.platforms.mac["available"]=temp.platforms.mac["mac"]
    delete temp.platforms.mac["mac"]
    temp.platforms.linux["available"]=temp.platforms.linux["linux"]
    delete temp.platforms.linux["linux"]

    tryAddToJson("pc_requirements",app,temp.platforms.pc)
    tryAddToJson("mac_requirements",app,temp.platforms.mac)
    tryAddToJson("linux_requirements",app,temp.platforms.linux)


    temp.release={
        "coming_soon":"",
        "date":""
    }
    tryAddToJson("coming_soon",app.release_date, temp.release)
    tryAddToJson("date", app.release_date,temp.release)


    temp.support={
        "url":"",
        "email":""
    }
    tryAddToJson("url",app.support_info, temp.support)
    tryAddToJson("email", app.support_info,temp.support)


    temp.recommendations={}
    tryAddToJson("recommendations",app,temp)
    try{
        temp.recommendations=temp.recommendations.total
    } catch{
        writeLog("no recommendations found for " + app.steam_appid)
    }


    tryAddToJson("genres",app,temp)
    try {
        temp.genreList = temp.genres
        temp.genres = []
        for (let i = 0; i < temp.genreList.length; i++) {
            temp.genres.push(temp.genreList[i].description)
        }
    } catch {
        writeLog("no genre found for " + app.steam_appid)
    }

    tryAddToJson("categories",app,temp)
    try {
        temp.categoryList = temp.categories
        temp.categories = []
        for (let i = 0; i < temp.categoryList.length; i++) {
            temp.categories.push(temp.categoryList[i].description)
        }
    } catch {
        writeLog("no categories found for " + app.steam_appid)
    }

    tryAddToJson("screenshots",app,temp)
    try {
        temp.screenshotList = temp.screenshots
        temp.screenshots = []
        for (let i = 0; i < temp.screenshotList.length; i++) {
            temp.screenshots.push(temp.screenshotList[i].path_full)
        }
    }
    catch{
        writeLog("no screenshots found for " + app.steam_appid)
    }




    tryAddToJson("movies",app,temp)
    try {
        temp.movieList = temp.movies
        temp.movies = []
        for (let movie in temp.movieList) {
            temp.movies.push({
                "name": temp.movieList[movie].name,
                "mp4": temp.movieList[movie].mp4.max,
                "webm": temp.movieList[movie].webm.max,
                "thumbnail": temp.movieList[movie].thumbnail
            })
        }
    } catch{
        writeLog("no screenshots found for " + app.steam_appid)
    }

    // top
    let success={"success":true}
    tryAddToJson("success",success,simplifiedInfo)
    tryAddToJson("steam_appid",app,temp)
    simplifiedInfo.appid=temp.steam_appid
    tryAddToJson("name",app,simplifiedInfo)
    tryAddToJson("required_age",app,simplifiedInfo)
    //writeLog(tryAddToJson("price_overview",app,simplifiedInfo))
    tryAddToJson("is_free",app,simplifiedInfo)
    // base
    tryAddToJson("type",app,simplifiedInfo)
    //simplifiedInfo.price_overview={}
    //tryAddToJson("is_free",app,simplifiedInfo)
    //tryAddToJson("price_overview",app,simplifiedInfo)

    simplifiedInfo.description={}
    tryAddToJson("detailed_description",app,simplifiedInfo.description)
    tryAddToJson("about_the_game",app,simplifiedInfo.description)
    tryAddToJson("short_description",app,simplifiedInfo.description)
    simplifiedInfo.media={}
    tryAddToJson("header_image",app,simplifiedInfo.media)
    tryAddToJson("background",app,simplifiedInfo.media)
    tryAddToJson("website",app,simplifiedInfo)
    tryAddToJson("publishers",app,simplifiedInfo)

    // optional
    tryAddToJson("developers",app,simplifiedInfo)
    tryAddToJson("legal_notice",app,simplifiedInfo)
    tryAddToJson("fullgame",app,simplifiedInfo)
    tryAddToJson("demos",app,simplifiedInfo)
    tryAddToJson("dlc",app,simplifiedInfo)
    tryAddToJson("controller_support",app,simplifiedInfo)
    tryAddToJson("metacritic",app,simplifiedInfo)

    // temp
    tryAddToJson("recommendations",temp,simplifiedInfo)
    if (temp.genres[0]!==undefined) {
        tryAddToJson("genres", temp, simplifiedInfo)
    }

    if (temp.categories[0]!==undefined) {
        tryAddToJson("categories", temp, simplifiedInfo)
    }


    if (temp.screenshots[0]!==undefined) {

        tryAddToJson("screenshots", temp, simplifiedInfo.media)
    }

    //writeLog(temp.movies[0])
    if (temp.movies[0]!==undefined) {

        tryAddToJson("movies", temp, simplifiedInfo.media)
    }
    tryAddToJson("platforms",temp,simplifiedInfo)
    tryAddToJson("release",temp,simplifiedInfo)
    tryAddToJson("support",temp,simplifiedInfo)

    return simplifiedInfo
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function getRandomApp(apps){
    try {
        let randGameIndex = getRandomInt(apps.length - 1)
        //writeLog(apps[randGameIndex])
        return apps[randGameIndex]
    }catch (err){
        return apps[0]
    }
}

function writeToJSONFile(url, jsonFileName, req, res, action) {

    try {

        if (fs.existsSync(jsonFileName)===false || InitPaths.serverFiles().ignore.includes(jsonFileName)) {

            request.get(url, function(error, steamHttpResponse, steamHttpBody) {
                try {
                    let data = JSON.parse(steamHttpBody);

                    if (jsonFileName===InitPaths.serverFiles().pingJSON){

                        const ip=req.headers['x-forwarded-for'] || req.connection.remoteAddress;
                        fs.appendFileSync(InitPaths.serverFiles().ipLog,ip)

                    }
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
        writeLog(err)
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

function deleteFile(filePath, override = false, log = true){
    //writeLog("deletefile: "+reset)
    const ignore = InitPaths.serverFiles().ignore
    ignore.push(InitPaths.serverFiles().appListJSON)
    if (ignore.includes(filePath)===false && override===false) {
        fs.unlink(filePath, function (err) {
            if (log) {
                if (err && err.code === 'ENOENT') {
                    // file doens't exist
                    writeLog("File doesn't exist, won't remove it.");
                } else if (err) {
                    // other errors, e.g. maybe we don't have enough permission
                    writeLog("Error occurred while trying to remove file");
                } else {
                    writeLog("Removed: " + filePath);
                }
            }
        });
    }
    if (override===true){
        fs.unlink(filePath, function (err) {
            if (err && err.code === 'ENOENT') {
                // file doens't exist
                writeLog("File doesn't exist, won't remove it.");
            } else if (err) {
                // other errors, e.g. maybe we don't have enough permission
                writeLog("Error occurred while trying to remove file");
            } else {
                writeLog("Removed: " + filePath);
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
            writeLog('Sent: ' + jsonFileName, req.ip);
        }
    });
}

function sendJSONFile(jsonFileName, req, res, reset=false){
    //writeLog("sendthefile: "+reset)
    if (reset===false){
        res.sendFile(jsonFileName, jsonFileOptions, function (err) {
            if (err) {
                console.error(err);
            } else {
                writeLog('Sent: ' + jsonFileName, req.ip);
                deleteFile(jsonFileName, false)
            }
        });
    }
    else{
        res.sendFile(jsonFileName, jsonFileOptions, function (err) {
            if (err) {
                console.error(err);
            } else {
                writeLog('Sent: ' + jsonFileName, req.ip);
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
                        //writeLog(simplifyInfo(infoData.appid.data))
                        if (infoData[appid].success) {
                            fullInfo.info = simplifyInfo(infoData[appid].data)
                        }


                        //let filter=req.params.filter.split(",")
                        //writeLog(filter)
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

async function getIDFromVanityUser(vanityUser, jsonFileName, urlHead, req, res, log=true) {

    let idUrl = InitPaths.vanityUserURL(req,vanityUser);

    let response = await got(idUrl, {json: true})
    let id=response.body.response.steamid;
    if(log) {
        let ip=req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        writeLog(vanityUser + " found; SteamID: " + id, ip);
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

    //writeLog(steamid)
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

function simplifyFeature(feature){
    return{
        "id": feature.id,
        "name": feature.name,
        "discounted": feature.discounted,
        "discountPercent": feature.discount_percent,
        "originalPrice": feature.original_price,
        "finalPrice": feature.final_price,
        "image": feature.large_capsule_image,
        "windows": feature.windows_available,
        "mac": feature.mac_available,
        "linux": feature.linux_available
    }
}

function simplifyFeatured(featured){
    let simplified=[]
    for (let feature of featured){
        simplified.push( simplifyFeature(feature))
    }
    return simplified
}

function sendFeatured(req, res){

    let fileNames=InitPaths.featuredFileNames();
    let urls=InitPaths.staticURLs();

    //writeLog(urls, fileNames)

    writeToJSONFile(urls.featuredURL,fileNames.featuredJSON,req,res,function(jsonFileName, req, res){

        let featuredData = readFromJSONFile(fileNames.featuredJSON)
        //writeLog(featuredData)
        deleteFile(fileNames.featuredJSON)

        writeToJSONFile(urls.featuredCatsURL,fileNames.featuredCatsJSON,req,res,function(jsonFileName, req, res){
            let featuredCatsData = readFromJSONFile(fileNames.featuredCatsJSON)
            deleteFile(fileNames.featuredCatsJSON)

            let fullInfo={}

            fullInfo.specials=simplifyFeatured(featuredCatsData.specials.items)
            fullInfo.comingSoon=simplifyFeatured(featuredCatsData.coming_soon.items)
            fullInfo.topSellers=simplifyFeatured(featuredCatsData.top_sellers.items)
            fullInfo.newReleases=simplifyFeatured(featuredCatsData.new_releases.items)


            //writeLog(fullInfo)

            let platforms = []

            platforms[0]=featuredData.featured_win
            platforms[1]=featuredData.featured_mac
            platforms[2]=featuredData.featured_linux

            let ids=[]
            let featured=[]

            for (let platform of platforms){
                for (let feature of platform){
                    let id=feature.id
                    if(ids.includes(id)===false){
                        ids.push(id)
                        featured.push(feature)
                    }



                }
            }
            //writeLog(featured,ids)

            fullInfo.featured=simplifyFeatured(featured)


            justWrite(fullInfo,fileNames.fullFeaturedJSON)

            sendJSONFile(fileNames.fullFeaturedJSON,req, res)

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
    //clearDir(InitPaths.dataDir)


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

app.get('/vanity/:steamid', function (req, res){
    let steamid = req.params.steamid;

    let jsonFileName = InitPaths.userFileNames(steamid).infoJSON;

    let url = InitPaths.userURLs(steamid,req).infoURL;


    writeToJSONFile(url,jsonFileName,req,res,function(jsonFileName, req, res){

        let jsonFile = fs.readFileSync(jsonFileName);
        let resp = JSON.parse(jsonFile).response.players
        let steamid = {}

        try{
            steamid.steamid=resp[0].steamid;
            try{
                steamid.vanity=resp[0].personaname;
            }
            catch{
                writeLog("No vanity found for "+steamid.steamid)
            }
            try{
                steamid.realName=resp[0].realname;
            }
            catch{
                writeLog("No real name found for "+steamid.steamid)
            }

            let path = InitPaths.vanityUserFileName(steamid.steamid)

            justWrite(steamid,path)
            deleteFile(jsonFileName)
            //writeLog(steamid)
            sendJSONFile(path,req, res)
        }
        catch{
            sendUndefined(req,res)
            deleteFile(jsonFileName)
        }





    });

})

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
                    //writeLog(randApp)
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
        //writeLog("query: "+reset)
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
        writeLog(randApp)

        sendFullGameFromID(randApp.appid,req,res)
    });
});

app.get('/apps/:appid/infoFull', function(req, res) {

    sendFullGameFromID(req.params.appid, req, res,)

});

app.get('/apps/featured', function(req, res) {

    sendFeatured(req, res,)

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

const source = InitPaths.host('remote')


app.listen(server_port, server_host, function() {
    fs.appendFileSync(InitPaths.serverFiles().consoleLog,'------------------------------------------------------------\r\n')
    writeLog('SERVER START',source);
});
