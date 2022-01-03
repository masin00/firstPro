const axios = require('axios');
const moment = require('moment');
const { logger } = require('../logger');

const LSPORT_API_URL = 'http://api.lsports.eu/api/';
const LSPORT_PREMATCH_API_URL = 'http://prematch.lsports.eu/OddService';
const LSPORT_INPLAY_API_URL = 'http://inplay.lsports.eu/api';

const LSPORT_PREMATCH_USER_NAME = 'dnjsrur99@nate.com';//'carwinner231@gmail.com';
const LSPORT_PREMATCH_PASSWORD = '9d4f2c02';
const LSPORT_PREMATCH_API_GUID = 'f426fd03-ef04-4202-941d-b6fc48995a4c';

const LSPORT_USER_NAME = 'carwinner23@gmail.com';
const LSPORT_PASSWORD = 'pzcr5tg7xdDR430';
const LSPORT_API_GUID = '775946fa-f379-411f-a2c1-acd005d1a3d3';
const LSPORT_PACKAGE_ID = '2197';

const DEF_BOOKMAKER = 8;
const MAX_READCNT = 5;
let g_iReadedCnt=5;
let g_lastTimeStamp = Math.floor(new Date().getTime()/1000-(60*5));  //Changes Every 5 Minutes;

//http://inplay.lsports.eu/api/schedule/GetInPlaySchedule?username=gdnjsrur8@nate.com&password=9d4f2c02&packageid=2021&SportIds=6046,154914,48242,154830,35232&ProviderIds=8
//http://inplay.lsports.eu/api/schedule/OrderFixtures?username=gdnjsrur8@nate.com&password=9d4f2c02&packageid=2021&SportIds=6046,154914,48242,154830,35232&ProviderIds=8&fixtureIds=%7BfixtureIds%7D

//http://prematch.lsports.eu/OddService/EnablePackage?username=dnjsrur81@nate.com&password=9d4f2c02&guid=3d76c55f-eebe-443c-a221-f8f90f2eec03

const AxiosOptions = {
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept-Encoding': 'gzip',
        'Cache-Control': 'no-cache'
    },
};
const getEventSnapshot = (eventID) =>{
    return new Promise((resolve,reject)=>{
        axios.get(`${LSPORT_INPLAY_API_URL}/Snapshot/GetSnapshotJson?username=${LSPORT_USER_NAME}&password=${LSPORT_PASSWORD}&packageid=YOUR_PACKAGE_ID&fixturesIds=${eventID}`,AxiosOptions)
            .then((eventSnapshot)=>{
                return resolve(eventSnapshot)
        }).catch((snapshotFetchError)=>{
            return reject({snapshotFetchError})
        })
    })
};



/**
 * Function Returns Axios Promise - You should call .then() on it in order to make the request
 * @param packageID
 * @param enable
 * @param inplay
 * @return {*}
 */
const packageController =(packageID='YOUR_PACKAGE_ID',enable=true,inplay=true)=>{

    let url;
    if (inplay) {
        enable ? url = `${LSPORT_INPLAY_API_URL}/Package/EnablePackage?username=${LSPORT_USER_NAME}&password=${LSPORT_PASSWORD}&packageid=${packageID}'` :
            url = `${LSPORT_INPLAY_API_URL}/Package/DisablePackage?username=${LSPORT_USER_NAME}&password=${LSPORT_PASSWORD}&packageid=${packageID}'`
    } else {
        enable ? url = `${LSPORT_PREMATCH_API_URL}/EnablePackage?username=${LSPORT_USER_NAME}&password=${LSPORT_PASSWORD}&packageid=${packageID}'` :
            url = `${LSPORT_PREMATCH_API_URL}/DisablePackage?username=${LSPORT_USER_NAME}&password=${LSPORT_PASSWORD}&packageid=${packageID}'`
    }

    return axios.get(url,AxiosOptions);
};

/**
 * Function Returns Axios Promise - You should call .then() on it in order to make the request
 */
const getEvents = (DaysAhead=1, sports, bookmakers, markets)=>{   
    //let From_Date = moment().format('DD/MM/YYYY');
    let From_Date = moment().add(-1,'days').format('DD/MM/YYYY');
    let To_Date = moment().add(DaysAhead,'days').format('DD/MM/YYYY');
    //let LAST_TIMESTAMP = Math.floor(new Date().getTime()/1000-(60*beforeMin));  //Changes Every 5 Minutes
    //let url = `${LSPORT_PREMATCH_API_URL}/GetEvents?username=${LSPORT_PREMATCH_USER_NAME}&password=${LSPORT_PASSWORD}&guid=${LSPORT_API_GUID}&Sports=${sports}&Bookmakers=${bookmakers}&Markets=${markets}&fromDate=${From_Date}&toDate=${To_Date}`
    let url = `http://192.168.0.1:8070/game.json`;
   
    /*++g_iReadedCnt;
    if (g_iReadedCnt>=MAX_READCNT) {
        g_iReadedCnt=0;
        g_lastTimeStamp = Math.floor(new Date().getTime()/1000-60);
    } else {
        url = url + `&timestamp=${g_lastTimeStamp}`;
        g_lastTimeStamp = Math.floor(new Date().getTime()/1000-60);
    }*/

    console.log('g_iReadedCnt:' + g_iReadedCnt + ' => ' + url);
    logger.info('g_iReadedCnt:' + g_iReadedCnt + ' => ' + url);
        
    return axios.get(url,AxiosOptions);
};



//const LSPORT_PREMATCH_USER_NAME = 'dnjsrur99@nate.com';//'carwinner231@gmail.com';
//const LSPORT_PREMATCH_PASSWORD = '9d4f2c02';
//const LSPORT_PREMATCH_API_GUID = 'f426fd03-ef04-4202-941d-b6fc48995a4c';

const getEventsForLive = (DaysAhead=1, sports, markets)=>{   
    //let From_Date = moment().format('DD/MM/YYYY');
    let From_Date = moment().add(-1,'days').format('DD/MM/YYYY');
    let To_Date = moment().add(DaysAhead,'days').format('DD/MM/YYYY');
    //let LAST_TIMESTAMP = Math.floor(new Date().getTime()/1000-(60*beforeMin));  //Changes Every 5 Minutes
    let url = `${LSPORT_PREMATCH_API_URL}/GetEvents?username=${LSPORT_PREMATCH_USER_NAME}&password=${LSPORT_PREMATCH_PASSWORD}&guid=${LSPORT_PREMATCH_API_GUID}&Sports=${sports}&Bookmakers=${DEF_BOOKMAKER}&Markets=${markets}&fromDate=${From_Date}&toDate=${To_Date}`
    //let url = `http://192.168.0.1:8070/game.json`;
   
    /*++g_iReadedCnt;
    if (g_iReadedCnt>=MAX_READCNT) {
        g_iReadedCnt=0;
        g_lastTimeStamp = Math.floor(new Date().getTime()/1000-60);
    } else {
        url = url + `&timestamp=${g_lastTimeStamp}`;
        g_lastTimeStamp = Math.floor(new Date().getTime()/1000-60);
    }*/

    console.log('g_iReadedCnt:' + g_iReadedCnt + ' => ' + url);
    logger.info('g_iReadedCnt:' + g_iReadedCnt + ' => ' + url);
        
    return axios.get(url,AxiosOptions);
};

const getFixtures = (DaysAhead=3)=>{
    let From_Date = moment().format('DD/MM/YYYY');
    let To_Date = moment().add(DaysAhead,'days').format('DD/MM/YYYY');
    let LAST_TIMESTAMP = Math.floor(new Date().getTime()/1000-(60*3));  //Changes Every 3 Minutes
    let url = `${LSPORT_PREMATCH_API_URL}/GetFixtures?username=${LSPORT_USER_NAME}&password=${LSPORT_PASSWORD}&guid=${LSPORT_API_GUID}&fromDate=${From_Date}&toDate=${To_Date}&timestamp=${LAST_TIMESTAMP}`;
    return axios.get(url,AxiosOptions);
};

const getMarkets = (DaysAhead=3)=>{
    let From_Date = moment().format('DD/MM/YYYY');
    let To_Date = moment().add(DaysAhead,'days').format('DD/MM/YYYY');
    let LAST_TIMESTAMP = Math.floor(new Date().getTime()/1000-(60*3));  //Changes Every 3 Minutes
    let url = `${LSPORT_PREMATCH_API_URL}/GetFixtureMarkets?username=${LSPORT_USER_NAME}&password=${LSPORT_PASSWORD}&guid=${LSPORT_API_GUID}&fromDate=${From_Date}&toDate=${To_Date}&timestamp=${LAST_TIMESTAMP}`;
    return axios.get(url,AxiosOptions);
};

const getMarketKinds = ()=>{
    let url = `${LSPORT_PREMATCH_API_URL}/GetMarkets?username=${LSPORT_PREMATCH_USER_NAME}&password=${LSPORT_PREMATCH_PASSWORD}&guid=${LSPORT_PREMATCH_API_GUID}&lang=ko`;
    return axios.get(url,AxiosOptions);
};

//http://inplay.lsports.eu/api/Package/EnablePackage?username=gdnjsrur8@nate.com&password=9d4f2c02&packageid=2021
const enablePackage = ()=>{
    let url = `${LSPORT_INPLAY_API_URL}/Package/EnablePackage?username=${LSPORT_USER_NAME}&password=${LSPORT_PASSWORD}&packageid=${LSPORT_PACKAGE_ID}`;
    return axios.get(url,AxiosOptions);
};



const getInPlaySchedule = ()=>{
    //let From_Date = moment().format('DD/MM/YYYY');
    //let To_Date = moment().add(DaysAhead,'days').format('DD/MM/YYYY');
    //let LAST_TIMESTAMP = Math.floor(new Date().getTime()/1000-(60*3));  //Changes Every 3 Minutes
    let url = `${LSPORT_INPLAY_API_URL}/schedule/GetInPlaySchedule?username=${LSPORT_USER_NAME}&password=${LSPORT_PASSWORD}&packageid=${LSPORT_PACKAGE_ID}&SportIds=6046,154914,48242,154830,35232&ProviderIds=8`;
    return axios.get(url,AxiosOptions);
};

//http://inplay.lsports.eu/api/schedule/OrderFixtures?username=gdnjsrur8@nate.com&password=9d4f2c02&packageid=2021&fixtureIds=4120524&ProviderIds=8
const orderFixtures = async function order_Fixtures(oddID) {
    //let From_Date = moment().format('DD/MM/YYYY');
    //let To_Date = moment().add(DaysAhead,'days').format('DD/MM/YYYY');
    //let LAST_TIMESTAMP = Math.floor(new Date().getTime()/1000-(60*3));  //Changes Every 3 Minutes
    let url = `${LSPORT_INPLAY_API_URL}/schedule/OrderFixtures?username=${LSPORT_USER_NAME}&password=${LSPORT_PASSWORD}&packageid=${LSPORT_PACKAGE_ID}&fixtureIds=${oddID}&ProviderIds=8`;
    return axios.get(url,AxiosOptions);
};

//http://inplay.lsports.eu/api/schedule/CancelFixtureOrders?username=%7Busername%7D&password=%7Bpassword%7D&packageid=%7BpackageId%7D&fixtureIds=%7BfixtureIds%7D
const orderCancelFixtures = async function order_Fixtures(oddID) {
    //let From_Date = moment().format('DD/MM/YYYY');
    //let To_Date = moment().add(DaysAhead,'days').format('DD/MM/YYYY');
    //let LAST_TIMESTAMP = Math.floor(new Date().getTime()/1000-(60*3));  //Changes Every 3 Minutes
    let url = `${LSPORT_INPLAY_API_URL}/schedule/CancelFixtureOrders?username=${LSPORT_USER_NAME}&password=${LSPORT_PASSWORD}&packageid=${LSPORT_PACKAGE_ID}&fixtureIds=${oddID}&ProviderIds=8`;
    return axios.get(url,AxiosOptions);
};

//http://inplay.lsports.eu/api/schedule/CancelFixtureOrders?username=gdnjsrur8@nate.com&password=9d4f2c02&packageid=2021&fixtureIds=4244130

const getSnapshotJson = async function getSnapshot_Json(oddID) {
    //let From_Date = moment().format('DD/MM/YYYY');
    //let To_Date = moment().add(DaysAhead,'days').format('DD/MM/YYYY');
    //let LAST_TIMESTAMP = Math.floor(new Date().getTime()/1000-(60*3));  //Changes Every 3 Minutes
    let url = `${LSPORT_INPLAY_API_URL}/Snapshot/GetSnapshotJson?username=${LSPORT_USER_NAME}&password=${LSPORT_PASSWORD}&packageid=${LSPORT_PACKAGE_ID}&fixtureIds=${oddID}&ProviderIds=8`;
    return axios.get(url,AxiosOptions);
};

//http://inplay.lsports.eu/api/schedule/GetOrderedFixtures?username=dnjsrur8@nate.com&password=9d4f2c02&packageid=2021&ProviderIDs=8&fixtureIds=%7BfixtureIds%7D
//http://inplay.lsports.eu/api/schedule/GetOrderedFixtures?username=dnjsrur8@nate.com&password=9d4f2c02&packageid=2021&fixtureIds=%7BfixtureIds%7D
//http://inplay.lsports.eu/api/Snapshot/GetSnapshotJson?username=dnjsrur8@nate.com&password=9d4f2c02&packageid=2021&SportIds=6046,154914,48242,154830,35232&ProviderIds=8fixtureIds=4120529
//http://inplay.lsports.eu/api/Package/EnablePackage?username=dnjsrur8@nate.com&password=9d4f2c02&packageid=2021

module.exports= {
    DEF_BOOKMAKER,
    getEvents,
    getEventsForLive,
    getFixtures,
    getMarkets,
    getMarketKinds,

    enablePackage,
    getInPlaySchedule,
    orderFixtures,
    orderCancelFixtures,
    getSnapshotJson,
    getEventSnapshot,    
    packageController
}