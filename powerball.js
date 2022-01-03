const moment = require('moment');
const axios = require('axios');
const cron = require('node-cron');
const db = require('./db');
const fs = require('fs');

//const lsportApi = require('./scripts/lsportApiRequests');
//const lsportAmqplib = require('./scripts/lsportConnect');

const { logger } = require('./logger');
const powerballWorker = require('./powerballWorker')
// var logger = require('./logger'); // 방금 추가한 logger.js 

const AxiosOptions = {
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept-Encoding': 'gzip'
    },
};

//======================
//======================

//npm install -g nodemon
//npm install 



let g_config = null;
let g_iLeagueIdx = null;

let g_beforeRound = "";
let g_iParseErrCnt = 0;
let g_iParseType = 0;

const initialize = async () => {
    await db.connect();

    //console.log('*** DEF_SERVER : ' + db.DEF_SERVER);
    logger.info('*** DEF_SERVER v1.2 : ' + db.DEF_SERVER);

    //00. 게임 마감 처리
    setTimeout(procGameFinish, 1000, 'procGameFinish');


    setTimeout(procGame, 1000, 'procGame'); 

};

initialize();



//==============================================================================
//========      00. 게임 마감 처리
//==============================================================================
const PROC_GAMEFINISH_URL = `http://${db.DEF_DB_SERVER}:8001/ProcGameFinish_Game.asp`;
/*const axiosProcGameFinish = async function axiosProcGameFinish() {
    let url = `${PROC_GAMEFINISH_URL}`;
    //console.log(url);
    //logger.info("axiosProcGameFinish => " + url);
    return axios.get(url,AxiosOptions);
} */
const procGameFinish = async function procGameFinish() {    
    let res = null;
    let data = null;
    let i=0;

    try {
        //console.log('running procGameFinish()....');        
        //axiosProcGameFinish().then(async (response)=>{    
        await axios.get(PROC_GAMEFINISH_URL,AxiosOptions).then(async (response)=>{    
            console.log(response.data);
        }).catch((error)=>{
            console.log({error});
            logger.error({error});
        });
        console.log('done procGameFinish()....');
    } catch (e) {
        console.log("procGameFinish Error" + e);   
        logger.error({e});
    } finally {
        setTimeout(procGameFinish, 2000, 'procGameFinish');
    }   
}

//==============================================================================
//==============================================================================

const procGame = async function procGame() {     
    let szURL = '';
    try {
        let procDate = await db.Select_TProcGame();   
       
        if (!procDate)
            return 0;

        console.log(`procDate : ${procDate.idx} => ${procDate.gameType}, ${procDate.kind}, ${procDate.subIdx}`);

        if (procDate.gameType=='PowerBall') {
            if (procDate.kind==1)
                szURL = `http://${db.DEF_DB_SERVER}:8001/Apply_money_result_pb.asp?subgameidx[]=${procDate.subIdx},0`;       
            else if (procDate.kind==2)
                szURL = `http://${db.DEF_DB_SERVER}:8001/Apply_money_cancel_pb.asp?sidx=${procDate.subIdx}`;
        }            
        else if (procDate.gameType=='PowerLadder') {
            if (procDate.kind==1)
                szURL = `http://${db.DEF_DB_SERVER}:8001/Apply_money_result_powLadder.asp?subgameidx[]=${procDate.subIdx},0`;       
            else if (procDate.kind==2) 
                szURL = `http://${db.DEF_DB_SERVER}:8001/Apply_money_cancel_powLadder.asp?sidx=${procDate.subIdx}`;
        }
        else if (procDate.gameType=='Eos') {
            if (procDate.kind==1)
                szURL = `http://${db.DEF_DB_SERVER}:8001/Apply_money_result_Eos.asp?subgameidx[]=${procDate.subIdx},0`;       
            else if (procDate.kind==2) 
                szURL = `http://${db.DEF_DB_SERVER}:8001/Apply_money_cancel_Eos.asp?sidx=${procDate.subIdx}`;
        } else {
            return 0;
        }
       
        
        //await axiosGiveMoney(szURL).then(async (response)=>{   
        await    axios.get(szURL,AxiosOptions).then(async (response)=>{               
            //console.log(response);  
            if ( (response.status == 200) && (response.data) ) {
                await db.Update_TProcGame(procDate.idx, 1);  
            } else {
                await db.Update_TProcGame(procDate.idx, 2); 
            }
        
        }).catch((error)=>{
            db.Update_TProcGame(procDate.idx, 4);  
        });      

    } catch (e) {
        console.log("procGame Error" + e);   
    } finally {
        //console.log('done procParser()....');
        setTimeout(procGame, 1000, 'procGame');
    }   
}



