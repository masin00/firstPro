const db = require('./db');
const moment = require('moment');
const axios = require('axios');
const _cliProgress = require('cli-progress');

// Load the full build.
var _ = require('lodash');
const { logger } = require('./logger');
const WaitQueue = require('wait-queue')
const wq = new WaitQueue

let g_config = null;
let g_marketInfo = null;

const DEF_FOOTBALL = 6046;
const DEF_BASEBALL = 154914;
const DEF_BASKETBALL = 48242;
const DEF_VOLLEYBALL = 154830;
const DEF_ICEHOCKEY = 35232;


async function setConfig(data) { 
    g_config = data;
} 

async function setMarketInfo(data) { 
    g_marketInfo = data;
} 

//const parseGameSub = async (data) => {
const doProc = async function parseGameSub(id, data) {
    try {
        //const rates = await db.selectTLiveGameLS_ReadFlag(); // ???초기 
        //console.log(data);     
        //logger.info(data);

    /*
    0	Full event (fixture, markets, livescore)
    1	Fixture metadata update
    2	Livescore update
    3	Market update
    4	Leagues
    5	Sports
    6	Locations
    7	Markets
    8	Bookmakers
    31	Keep Alive
    32	Heartbeat
    35	Settlements
    36	Snapshot
    37	Outright fixture metadata
    */
        if (!data.Header){
            return ;
        }

        switch (data.Header.Type) {
            case 0:
                console.log("======> 0	Full event (fixture, markets, livescore)");
                logger.info(data);
            break;
            case 1:
                console.log("======> 1	Fixture metadata update");
                logger.info(data);

            break;
            case 2:
                //logger.info(data);
                console.log("======> 2	Livescore update (" + data.Body.Events[0].FixtureId + ")");
                function doUpdate(callback) {
                    // new Promise() 추가
                    return new Promise(function (resolve, reject) {                       
                            arrProc[id](data.Body.Events).then(()=>{
                                // Markets Response    
                                resolve();
                            }).catch((error)=>{
                                console.log({error})
                            })
                        
                    });
                } 
                doUpdate().then(function () {
                    // resolve()의 결과 값이 여기로 전달됨                    
                }).catch((error)=>{
                    console.log({error})
                });   
            break;
            case 3:
                console.log("======> 3	Market update (" + data.Body.Events[0].FixtureId + ")");
                function doUpdate(callback) {
                    // new Promise() 추가
                    return new Promise(function (resolve, reject) {                       
                            arrProc[id](data.Body.Events).then(()=>{
                                // Markets Response    
                                resolve();
                            }).catch((error)=>{
                                console.log({error})
                            })
                        
                    });
                } 
                doUpdate().then(function () {
                    // resolve()의 결과 값이 여기로 전달됨                    
                }).catch((error)=>{
                    console.log({error})
                });   
            break;
            case 4:
                logger.info(data);
                console.log("======> 4	Leagues");
            break;
            case 5:
                logger.info(data);
                console.log("======> 5	Sports");
            break;
            case 6:
                logger.info(data);
                console.log("======> 6	Locations");
            break;
            case 7:
                logger.info(data);
                console.log("======> 7	Markets");
            break;
            case 8:
                logger.info(data);
                console.log("======> 8	Bookmakers");
            break;


            case 31:
                //{"Header":{"Type":31,"MsgGuid":"25501be1-8b48-4912-9bc0-f795d5802104","ServerTimestamp":1546570028},"Body":{"KeepAlive":{"ActiveEvents":[],"ExtraData":null,"ProviderId":75}}},
                heartBeat_ServerTimestamp =  moment.unix(data.Header.ServerTimestamp);
                console.log("======>  31	Keep Alive => (" + data.Header.ServerTimestamp + ') ' +heartBeat_ServerTimestamp.format('YYYY-MM-DD HH:mm:ss'));  
            break;

            case 32:  
                heartBeat_ServerTimestamp =  moment.unix(data.Header.ServerTimestamp);
                //var m = moment();
            // m.unix(); //=> 1510598962
                //m.format(); //=> '2017-11-13T13:50:02-05:00'
                //{"Header":{"Type":32,"MsgGuid":"c647e5fe-9a0d-46a6-aa95-b3b5e3cd2ddf","ServerTimestamp":1546570030}
                console.log("======>  32	Heartbeat => (" + data.Header.ServerTimestamp + ') ' +heartBeat_ServerTimestamp.format('YYYY-MM-DD HH:mm:ss'));  
            break;

            case 35:    
                logger.info(data);
                console.log("======>  35	Settlements");   
            break;

            case 36:   
                console.log("======>  36	Snapshot (" + data.Body.Events.length + ")");
                function doUpdate(callback) {
                    // new Promise() 추가
                    return new Promise(function (resolve, reject) {
                        
                            arrProc[id](data.Body.Events).then(()=>{
                                // Markets Response    
                                resolve();
                            }).catch((error)=>{
                                console.log({error})
                            })
                        
                    });
                } 
                doUpdate().then(function () {
                    // resolve()의 결과 값이 여기로 전달됨                    
                }).catch((error)=>{
                    console.log({error})
                });   
            break;

            case 37:   
                logger.info(data);
                console.log("======>  37	Outright fixture metadata");
            break;

            default:
                console.log("======>  default.......");
                logger.error("default....... =>" + data.Header.Type);
            break;      
        }

        //data.body = rates;
    } catch (e) {
        console.log("parseGameSub Error" + e);   
    }
};

const doProc_Game =async function doProcGame(data)
{
    const FixtureId = data.FixtureId;
    let fixture = data.Fixture;
    const livescore = data.Livescore;
    const periods = null;            
    const statistics = null;
    const markets = data.Markets;

    
    let gameData = null;  
    let leagueData= null;   
    let i=0; j=0;
    let iHo_auto = 0, iOu_auto=0; 

    try {
        gameData =  await db.selectTGameInfo(FixtureId, fixture.StartDate);
        //console.log(gameData);
        if ( !gameData )  { // 게임 생성..
            leagueData = await db.select_tb_league(fixture.League.Id);
            if (!leagueData) {
                const sportsData =  await db.select_tb_sports(fixture.Sport.Id);
                if (sportsData) {
                    await db.insert_tb_league(sportsData.idx, sportsData.sports_name, fixture.League.Name, fixture.League.Id, "all",  fixture.Location.Id);
                    leagueData = await db.select_tb_league(fixture.League.Id);
                    
                } else {
                    return null;
                }
            } 
            if (!leagueData)
                return null;
            
            if (leagueData.NotUsed==1)
                return null;
                    
            let homePos=0, awaypos=0;
            
            for (j=0; j<fixture.Participants.length; ++j) {
                if (fixture.Participants[j].Position=='1') {
                    homePos = j;
                }
                if (fixture.Participants[j].Position=='2') {
                    awaypos = j;
                }                                        
            }

            let hometeamData =  await db.select_TTeamName(fixture.Participants[homePos].Id);
            if (!hometeamData) {
                await db.insert_TTeamName(fixture.Participants[homePos].Id, fixture.Participants[homePos].Name, fixture.Sport.Id);
                hometeamData =  await db.select_TTeamName(fixture.Participants[homePos].Id);
            }                     
            let awayteamData =  await db.select_TTeamName(fixture.Participants[awaypos].Id);
            if (!awayteamData) {
                await db.insert_TTeamName(fixture.Participants[awaypos].Id, fixture.Participants[awaypos].Name, fixture.Sport.Id);
                awayteamData =  await db.select_TTeamName(fixture.Participants[awaypos].Id);
            }

            switch (fixture.Sport.Id) {
            case DEF_FOOTBALL:
                iHo_auto = g_config.ho_auto_foot;
                iOu_auto = g_config.ou_auto_foot;
                break;
            case DEF_BASKETBALL:
                iHo_auto = g_config.ho_auto_basket;
                iOu_auto = g_config.ou_auto_basket;
                break;
            case DEF_ICEHOCKEY:
                iHo_auto = g_config.ho_auto_hockey;
                iOu_auto = g_config.ou_auto_hockey;
                break;		
            case DEF_BASEBALL:	
                iHo_auto = g_config.ho_auto_base;
                iOu_auto = g_config.ou_auto_base;
                break;
            case DEF_VOLLEYBALL:
                iHo_auto = g_config.ho_auto_volly;
                iOu_auto = g_config.ou_auto_volly;
                break;
            }
            
            await db.insertTGameInfo(leagueData.idx, hometeamData.TeamName, awayteamData.TeamName, fixture.StartDate, FixtureId, iHo_auto, iOu_auto);
            
            //sprintf(szBuff, "게임 추가 => EventID:%d [%s]-[%s]", stData.EventID, stData.stHome.Name, stData.stAway.Name);
            //LogWrite(szBuff);	
            
            //1:게임등록, 2:결과적용, 3:배당변경, 4:경고, 5:에러, 6:세부게임등록
            await db.insertOddErr(FixtureId, fixture.Sport.Id, hometeamData.TeamName, awayteamData.TeamName, "게임 추가", 1);

            gameData =  await db.selectTGameInfo(FixtureId, fixture.StartDate);
        }

        if (gameData.chggametime==1) {
            if ( (gameData.oddState<3) && (gameData.adupdate==0) ) {
                await db.updateTGameInfoGameTime(gameData.gameIdx, fixture.StartDate);   
                const retVal = checkPosition (fixture.Participants);             
                await db.insertOddErr(FixtureId, fixture.Sport.Id, fixture.Participants[retVal.posHome].Name, fixture.Participants[retVal.posAway].Name, "게임 시간 변경", 4);
            }
        }

        return {
            gameData: gameData,
            leagueData: leagueData
        };
    } catch (e) {
        console.log("doProcGame Error" + e);   
        logger.error("doProcGame Error" + e);   

        return {
            gameData: null,
            leagueData: null
        };
    }

    //return gameData;
}

function CheckOddState(iSportsID, blStatus1, blStatus2, iStep)
{
	let iInState = 0;
	let iOddStatus = 1;

	switch (iSportsID)
	{
	case DEF_FOOTBALL:
		iInState = g_config.instate_foot;
		break;
	case DEF_BASEBALL:
		iInState = g_config.instate_base;
		break;
	case DEF_BASKETBALL:
		iInState = g_config.instate_basket;
		break;
	case DEF_VOLLEYBALL:
		iInState = g_config.instate_volly;
		break;
	case DEF_ICEHOCKEY:
		iInState = g_config.instate_Hockey;
		break;
	}
	
	if (iInState==0)
	{
		iOddStatus = iStep;
		return FALSE;
	}
	else
	{		
		if ( (blStatus1==0) || (blStatus2==0) )
			iOddStatus = 0;

		if ( (iStep==1) && (iOddStatus==0) )
		{
			return true;
		}
		else
		{
			iOddStatus = iStep;
		}
	}

	return FALSE;
}

function ChkSuspended(blStatus1, blStatus2)
{
	if ( (blStatus1>1) || (blStatus2>1) )
		return 1;
	else
		return 0;
}

function Calc_MinusRate(oriRate, fRate, fMinus)
{
    let fTmp = 0.0;
    if (fRate==0)
        return Number(oriRate).toFixed(2);

    if (db.DEF_SERVER == 'WINNOVA') {
        fTmp = Math.floor((fRate-fMinus)*100) / 100; 
    } else {
        fTmp = Math.floor(fRate*fMinus*100) / 100;   
    }
    //fTmp = Math.floor(fRate*fMinus*100) / 100;
    if ( fTmp < g_config.OddMinRate)
        return g_config.OddMinRate.toFixed(2);
    else if ( fTmp > g_config.OddMaxRate)
        return  g_config.OddMaxRate.toFixed(2);

    return fTmp.toFixed(2);
}

const doProc_Sub = async function doProcSub(gameData, fixture, marketInfo, line, RateH, RateA, RateD, SubOddId, Status1st, Status2nd) {
    let iIsSuspended = 0;
    let blChangeStatus = false;
    let szBuff = '';
    let tmpLine = 0;

    try {
        if (RateH==null)
            tmpLine =0;
        if (RateA==null)
            tmpLine =0;

        if ( (marketInfo.gameKind==2) || (marketInfo.gameKind==3) ) {
            tmpLine = Math.abs(line);            			
            tmpLine = tmpLine - Math.floor(tmpLine);
			if ( (tmpLine == 0.25) || (tmpLine == 0.75) )
                return 0;

        }

        if ( (marketInfo.gameKind==2) ) {
            tmpLine = Math.abs(line);            			
          
            if (fixture.Sport.Id==DEF_FOOTBALL) {   
			    if (tmpLine ==0) 
                    return 0;

                if (db.DEF_SERVER=='ELITE') {
                    if ( (tmpLine>=-1.0) && (tmpLine<=1.0) )
                        return 0;
                }
            }
        }

        if (db.DEF_SERVER=='KHAN') {
            if ( (marketInfo.gameKind==2) || (marketInfo.gameKind==3) ) {
                tmpLine = Number(line); 

                if (marketInfo.id==2) {    //"Under/Over"
                    if (fixture.Sport.Id==DEF_FOOTBALL) {                    
                        if (tmpLine<2.0)
                            return 0;
                        if (tmpLine>4.5)
                            return 0;
                    }
                }
                
                if (marketInfo.id==28) {    //"Under/Over Including OverTime"
                    if (fixture.Sport.Id==DEF_ICEHOCKEY) {
                        if (tmpLine<4.5)
                            return 0;
                        if (tmpLine>6.5)
                            return 0;
                    }
                }

                if (marketInfo.id==3) {    //"Asian Handicap"
                    if (fixture.Sport.Id==DEF_FOOTBALL) {
                        if (tmpLine==0)
                            return 0;
                    }
                }

                if (marketInfo.id==342) {    //"Asian Handicap Including OverTime"
                    if (fixture.Sport.Id==DEF_ICEHOCKEY) {
                        if (tmpLine!=1.5)
                            return 0;
                    }
                }
            }
        }

        if (db.DEF_SERVER=='SKY') {
            if ( marketInfo.gameKind==3 ) {
                tmpLine = Number(line); 

                if (marketInfo.id==21) {    //"언더오버 [1 피리어드]"
                    if (fixture.Sport.Id==DEF_ICEHOCKEY) {
                        if (tmpLine!=1.5)
                            return 0;
                    }
                }
            }
        }

        subGame = await db.selectTGameSubInfo(line, marketInfo.spKind, marketInfo.period, gameData.gameIdx, marketInfo.gameKind);
        if (subGame==0)
            return 0;

        if (!subGame) {      
            if ( (Number(RateH)<=0) || (Number(RateA)<=0)  ) 
                return 0;
            
            iIsSuspended = ChkSuspended(Status1st, Status2nd);

            if (iIsSuspended==1)
                return 0;
            
            if (await db.insertTGameSubInfo(g_config, fixture.Sport.Id, gameData, marketInfo, RateH, RateA, RateD, SubOddId)) {
                //1:게임등록, 2:결과적용, 3:배당변경, 4:경고, 5:에러, 6:세부게임등록
                await db.insertOddErr(gameData.oddId, fixture.Sport.Id, gameData.homeName, gameData.awayName, marketInfo.name + ` 등록 [${RateD}]` , 6);
                await db.updateTGameInfo(gameData.gameIdx,  marketInfo.gameKind);

                await db.updateTOddService(1, 0);

                return 1;
            }                    
        } else if ( (subGame.subIdx>0) && (subGame.step<2) ){ 
            //blChangeStatus = CheckOddState(iSportsID, Status1st, Status2nd, iStep, iOddStatus);

           
            //    return ;
                // 1	Open	The bet is open (bets can be placed)
                // 2	Suspended	The bet is suspended (bets cannot be placed)
                // 3	Settled	The bet is settled (resulted) – a settlement is determined (see settlement enumeration for additional information)
            if ( (RateH<=0) || (RateA<=0)  ) {
                iIsSuspended = subGame.isSuspended;
                const tmpSupend =  ChkSuspended(Status1st, Status2nd);
                if (tmpSupend==1)
                    iIsSuspended = 1;
            } else {
                iIsSuspended = ChkSuspended(Status1st, Status2nd);
            }
            
            if (subGame.rate_changed==0)
            {
                const minusRateH = Calc_MinusRate(subGame.RateH, RateH, subGame.MinusH);
                const minusRateA = Calc_MinusRate(subGame.RateA, RateA, subGame.MinusA);
                let minusRateD = RateD;
                if ( marketInfo.gameKind==1 ) {
                    if (RateD>0)
                        minusRateD = Calc_MinusRate(subGame.RateD, RateD, subGame.MinusD);
                    else
                        minusRateD = subGame.RateD;
                }
                if ( (marketInfo.gameKind==2) || (marketInfo.gameKind==3) ) {
                    minusRateD = Number(minusRateD).toFixed(2);
                }

                if ( (subGame.RateH != minusRateH) || (subGame.RateA != minusRateA) || (subGame.isSuspended != iIsSuspended) )
                {
                    if (await db.updateTGameSubInfo(subGame.subIdx, minusRateH, minusRateA, minusRateD, iIsSuspended))
                    {
                        szBuff = marketInfo.name + ` [${subGame.RateH}-${subGame.RateD}-${subGame.RateA}] [${subGame.isSuspended}] => [${minusRateH}-${minusRateD}-${minusRateA}] [${iIsSuspended}]`;						
                        //1:게임등록, 2:결과적용, 3:배당변경, 4:경고, 5:에러, 6:세부게임등록, 7:읽기시작, 8:배당변경, 9:세부게임중지
                        //insertOddErr(stGameData.EventID, stGameData.SportID, stGameData.stHome.Name, stGameData.stAway.Name, szBuff, 8);
                        await db.insertOddErr(gameData.oddId, fixture.Sport.Id, gameData.homeName, gameData.awayName, szBuff, 8);	
                        
                        return 1;
                    }	                
                }
            }
        }
    } catch (e) {
        console.log("doProcSub Error" + e);   
        logger.error("doProcSub Error" + e);   
    }

    return 0;
}

function cutBaseLine(str) {
    const pos = str.indexOf("(");

    if (pos>0) {
        return str.substring(0, pos-1);
    }
    return str;
}

const doProc_HO_Auto = async function doProcHOAuto(gameData, fixture, marketInfo) {
	let iHO_Auto = 0;
    let iOU_Auto = 0;
    let iGameKind = 0;

    try {
        if (gameData.gameIdx<=0)
            return ;

        iGameKind = marketInfo.gameKind;
        if (marketInfo.spKind==1)
            iGameKind += 10;
        
        if ( ! ((iGameKind==2) || (iGameKind==3) || (iGameKind==12) || (iGameKind==13)) )
            return ;	
                        
        const gameHO = await db.selectTGameInfoHOAUTO(gameData.gameIdx);
        
        if (!gameHO)
            return ;

        if ( (iGameKind==2) && (gameHO.ho_auto==0) )
            return 1;

        if ( (iGameKind==12) && (gameHO.ho_auto==0) )
            return 1;

        if ( (iGameKind==3) && (gameHO.ou_auto==0) )
            return 1;

        if ( (iGameKind==13) && (gameHO.ou_auto==0) )
            return 1;

        if ( (iGameKind==2) || (iGameKind==12) )    // Handicap
        {
            switch (fixture.Sport.Id)
            {
            case DEF_FOOTBALL:
                iHO_Auto = g_config.ho_auto_foot;
                break;		
            case DEF_BASEBALL:	
                iHO_Auto = g_config.ho_auto_base;
                break;
            case DEF_BASKETBALL:
                iHO_Auto = g_config.ho_auto_basket;
                break;
            case DEF_VOLLEYBALL:
                iHO_Auto = g_config.ho_auto_volly;
                break;
            case DEF_ICEHOCKEY:
                iHO_Auto = g_config.ho_auto_hockey;
                break;		
            }

            if (iHO_Auto==1)
                await proc_HO_Auto(gameData, fixture, marketInfo, iGameKind);
        }

        if ( (iGameKind==3) || (iGameKind==13) )    // "Under/Over"
        {
            switch (fixture.Sport.Id)
            {
            case DEF_FOOTBALL:
                iOU_Auto = g_config.ou_auto_foot;
                break;		
            case DEF_BASEBALL:	
                iOU_Auto = g_config.ou_auto_base;
                break;
            case DEF_BASKETBALL:
                iOU_Auto = g_config.ou_auto_basket;
                break;
            case DEF_VOLLEYBALL:
                iOU_Auto = g_config.ou_auto_volly;
                break;
            case DEF_ICEHOCKEY:
                iOU_Auto = g_config.ou_auto_hockey;
                break;		
            }
            
            if (iOU_Auto==1)
                await proc_HO_Auto(gameData, fixture, marketInfo, iGameKind);
        }
    } catch (e) {
        console.log("doProcHOAuto Error" + e);   
        logger.error("doProcHOAuto Error" + e);   
    }
}
    

const proc_HO_Auto = async function procHOAUTO(gameData, fixture, marketInfo, iGameKind)
{
	let i=0, iIdx = 0;
	let iCnt = 0;
	let iCntAuto=0;

    try {
        switch (iGameKind)
        {
        case 3:
        case 13:
            switch (fixture.Sport.Id)
            {
            case DEF_FOOTBALL:	
                if (iGameKind==3)
                    iCntAuto = Math.floor(g_config.ou_auto_foot_cnt/2);
                else
                    iCntAuto = Math.floor(1/2);
                break;            		
            case DEF_BASEBALL:
                iCntAuto = Math.floor(g_config.ou_auto_base_cnt/2);
                break;
            case DEF_BASKETBALL:
                iCntAuto = Math.floor(g_config.ou_auto_basket_cnt/2);
                break;
            case DEF_VOLLEYBALL:
                iCntAuto = Math.floor(g_config.ou_auto_volly_cnt/2);
                break;	
            case DEF_ICEHOCKEY:
                iCntAuto = Math.floor(g_config.ou_auto_hockey_cnt/2);
                break;	
            }
            break;
        
        case 2:
        case 12:
            switch (fixture.Sport.Id)
            {
            case DEF_FOOTBALL:	
                iCntAuto = Math.floor(g_config.ho_auto_foot_cnt/2);
                break;            		
            case DEF_BASEBALL:
                iCntAuto = Math.floor(g_config.ho_auto_base_cnt/2);
                break;
            case DEF_BASKETBALL:
                iCntAuto = Math.floor(g_config.ho_auto_basket_cnt/2);
                break;
            case DEF_VOLLEYBALL:
                iCntAuto = Math.floor(g_config.ho_auto_volly_cnt/2);
                break;	
            case DEF_ICEHOCKEY:
                iCntAuto = Math.floor(g_config.ho_auto_hockey_cnt/2);
                break;	
            }
            break;        
        }

	    const subGame = await db.selectTGameSubInfoHOMinGap(gameData.gameIdx, iGameKind, marketInfo.period);

        if (!subGame)
            return ;

        if (subGame.subIdx>0)
        {
            const subGameList = await db.selectTGameSubInfoHO(gameData.gameIdx, iGameKind, marketInfo.period);

            if (!subGameList)
                return ;
                
            if (subGameList.length<=0)
                return ;

            iCnt = subGameList.length;

            if (iCnt<=(iCntAuto+1))
            {
                for (i=0; i<iCnt; ++i)
                {
                    subGameList[i].nowStep = 1;
                }
            }
            else
            {
                for (i=0; i<iCnt; ++i)
                {
                    if (subGameList[i].subIdx==subGame.subIdx)
                    {
                        iIdx = i;
                        break;
                    }
                }
                for (i=0; i<iCnt; ++i)
                {
                    if ( (i>=iIdx-iCntAuto) && (i<=iIdx+iCntAuto) )
                        subGameList[i].nowStep  = 1;
                    else
                        subGameList[i].nowStep  = 0;
                }
            }	
            
            for (i=0; i<iCnt; ++i)
            {		
                if ( subGameList[i].nowStep  != subGameList[i].step )
                    await db.updateTGameSubInfoStep(subGameList[i].subIdx, subGameList[i].nowStep);
                
            }
        }
	} catch (e) {
        console.log("procHOAUTO Error" + e);   
        logger.error("procHOAUTO Error" + e);   
    }
}

const doProc_GameSub = async function doProcGameSub(gameData, fixture, markets)
{      
    let i=0, j=0;
    let iGameKind = 0;
    let rateH=0, rateA=0, rateD=0;
    let fCurrRateD = 0;
    let fCurrRateH = 0;
    let fCurrRateA = 0;
    let Providers = null;
    let Bets = null;
    let szSubOddId = '';
    let iStatusH = 1;
    let iStatusA = 1;
    let iStatusD = 0;

    let sortedBet = null;
    let subGame = null;

    let baseLineH = 0;
    let baseLineA = 0;

    let iRetCnt = 0;
    let iSumRetCnt = 0;

    try {

        for (i=0; i<markets.length; ++i) {  
            const marketInfo = g_marketInfo.find(item =>  item.id === markets[i].Id);
           
            if (!marketInfo) {            
                console.log('markets[i].Id' + markets[i].Id);
                continue;
            }
           
            switch (fixture.Sport.Id)
            {
            case DEF_FOOTBALL:	
                if (marketInfo.regFoot===0)
                    continue;
                break;            		
            case DEF_BASEBALL:
                if (marketInfo.regBase===0)
                  continue;
                break;
            case DEF_BASKETBALL:
                if (marketInfo.regBasket===0)
                    continue;
                break;
            case DEF_VOLLEYBALL:
                if (marketInfo.regVolly===0)
                  continue;
                break;	
            case DEF_ICEHOCKEY:
                if (marketInfo.regHocky===0)
                 continue;
                break;	
            }

            Providers = markets[i].Providers;
            Bets = markets[i].Providers[0].Bets;
            
            switch(marketInfo.gameKind)
            {
            case 1: // "1X2" - 축구와 아이스하키1
                szSubOddId = ''; fCurrRateH = 0; fCurrRateD = 0; iStatusH = 0; fCurrRateA = 0; iStatusA = 0; baseLineH = 0; baseLineA = 0;

                for (j=0; j<Bets.length;++j)
                {
                    if (Bets[j].Name == "1") {                  
                        szSubOddId = Bets[j].Id;   
                        fCurrRateH = Bets[j].Price;   
                        iStatusH = Bets[j].Status; 
                    } else if (Bets[j].Name == "2") { 
                        fCurrRateA = Bets[j].Price;   
                        iStatusA = Bets[j].Status; 
                    } else if (Bets[j].Name == "X") { 
                        fCurrRateD = Bets[j].Price;   
                        iStatusD = Bets[j].Status; 
                    }
                }
                iRetCnt = await doProc_Sub(gameData, fixture, marketInfo, '', fCurrRateH, fCurrRateA, fCurrRateD, szSubOddId, iStatusH, iStatusA);         
                iSumRetCnt += iRetCnt;    
                break;
            case 2: // 핸디캡
                sortedBet = _.sortBy(Bets, ['BaseLine', 'Name']);

                //console.log(sortedBet);
                szSubOddId = ''; fCurrRateH = 0; fCurrRateD = 0; iStatusH = 0; fCurrRateA = 0; iStatusA = 0; baseLineH = 0; baseLineA = 0;

                for (j=0; j<sortedBet.length;++j) {
                    if (sortedBet[j].Name == "1") {                  
                        szSubOddId = sortedBet[j].Id;   
                        fCurrRateH = sortedBet[j].Price;   
                        iStatusH = sortedBet[j].Status; 
                        baseLineH = cutBaseLine(sortedBet[j].BaseLine); 

                        if ((j+1)<sortedBet.length) {
                            baseLineA = cutBaseLine(sortedBet[j+1].BaseLine);
                            if ( (baseLineH!=baseLineA) || (sortedBet[j+1].Name != "2")) {
                                iRetCnt = await doProc_Sub(gameData, fixture, marketInfo, baseLineH, fCurrRateH, fCurrRateA, baseLineH, szSubOddId, iStatusH, iStatusA);
                                iSumRetCnt += iRetCnt; 
                                szSubOddId = ''; fCurrRateH = 0; fCurrRateD = 0; iStatusH = 0; fCurrRateA = 0; iStatusA = 0; baseLineH = 0; baseLineA = 0;
                            }
                        }
                    } else if (sortedBet[j].Name == "2") {                         
                        fCurrRateA = sortedBet[j].Price;   
                        iStatusA = sortedBet[j].Status; 
                        baseLineA = cutBaseLine(sortedBet[j].BaseLine); 

                        //if (baseLineH==baseLineA)
                        iRetCnt = await doProc_Sub(gameData, fixture, marketInfo, baseLineA, fCurrRateH, fCurrRateA, baseLineA, szSubOddId, iStatusH, iStatusA);
                        iSumRetCnt += iRetCnt; 
                        szSubOddId = ''; fCurrRateH = 0; fCurrRateD = 0; iStatusH = 0; fCurrRateA = 0; iStatusA = 0; baseLineH = 0; baseLineA = 0;
                    }
                }

                if (iSumRetCnt>0)
                    await doProc_HO_Auto(gameData, fixture, marketInfo);
                break;
            case 3: // 오버언더
                sortedBet = _.sortBy(Bets, ['BaseLine', 'Name']);

                //console.log(sortedBet);
                szSubOddId = ''; fCurrRateH = 0; fCurrRateD = 0; iStatusH = 0; fCurrRateA = 0; iStatusA = 0; baseLineH = 0; baseLineA = 0;

                for (j=0; j<sortedBet.length;++j) {
                    if (sortedBet[j].Name == "Over") {                  
                        szSubOddId = sortedBet[j].Id;   
                        fCurrRateH = sortedBet[j].Price;   
                        iStatusH = sortedBet[j].Status; 
                        baseLineH = cutBaseLine(sortedBet[j].BaseLine); 

                        if ((j+1)<sortedBet.length) {
                            baseLineA = cutBaseLine(sortedBet[j+1].BaseLine);
                            if ( (baseLineH!=baseLineA) || (sortedBet[j+1].Name != "Under")) {
                                iRetCnt = await doProc_Sub(gameData, fixture, marketInfo, baseLineH, fCurrRateH, fCurrRateA, baseLineH, szSubOddId, iStatusH, iStatusA);
                                iSumRetCnt += iRetCnt; 
                                szSubOddId = ''; fCurrRateH = 0; fCurrRateD = 0; iStatusH = 0; fCurrRateA = 0; iStatusA = 0; baseLineH = 0; baseLineA = 0;
                            }
                        }
                    } else if (sortedBet[j].Name == "Under") { 
                        fCurrRateA = sortedBet[j].Price;   
                        iStatusA = sortedBet[j].Status; 
                        baseLineA = cutBaseLine(sortedBet[j].BaseLine); 

                        iRetCnt = await doProc_Sub(gameData, fixture, marketInfo, baseLineA, fCurrRateH, fCurrRateA, baseLineA, szSubOddId, iStatusH, iStatusA);
                        iSumRetCnt += iRetCnt; 
                        szSubOddId = ''; fCurrRateH = 0; fCurrRateD = 0; iStatusH = 0; fCurrRateA = 0; iStatusA = 0; baseLineH = 0; baseLineA = 0;
                    }
                }

                if (iSumRetCnt>0)
                    await doProc_HO_Auto(gameData, fixture, marketInfo);
                break;                
            case 4: //홀짝
                break;
            }
        }               
    } catch (e) {
        console.log("doProcGameSub Error" + e);   
        logger.error("doProcGameSub Error" + e);   

        return {
            gameData: null,
            leagueData: null
        };
    }
}

function checkPosition(Results) {
    let i=0;
    let posHome=0;  posAway=0;    
    for (i=0; i<Results.length; ++i) {
        if (Results[i].Position == '1')
            posHome = i;
        else if (Results[i].Position == '2')
            posAway = i;
    }	

    return {
        posHome: posHome,
        posAway: posAway
    };
}

//const APPLY_URL = 'http://127.0.0.1:8001/Apply_money_result_sub_A.asp?subgameidx[]=';
const APPLY_URL = 'http://192.168.223.100:8001/Apply_money_result_sub_A.asp?subgameidx[]=';
const AxiosOptions = {
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept-Encoding': 'gzip'
    },
};

const apply_Money_Result = async function applyMoneyResult(subIdx) {
    let url = `${APPLY_URL}${subIdx},0`;
    //console.log(url);
    logger.info("apply_Money_Result => " + url);
    return axios.get(url,AxiosOptions);
} 


const doProc_FinishGame = async function FinishGame(FixtureId, iGameIdx, iGameKind, iSpKind, iSPBeAf, iHScore, iAScore)
{
	let i=0;		
	let iRetVal = 0;
    let iSumScore = iHScore + iAScore;
    let subGames = null;
    let ret = 0;
    let retCnt = 0;

    try {        
        switch (iGameKind)
        {
        case 1://승무패
            subGames = await db.selectTGameSubInfoSimple(iGameIdx, iGameKind, iSpKind, iSPBeAf);
            if (!subGames)
                return 0;
            
            for (i=0; i<subGames.length; ++i)
            {
                if (subGames[i].subIdx==0)
                    break;

                if ( iHScore==iAScore )
                    iRetVal = 3;
                else if ( iHScore>iAScore )
                    iRetVal = 1;
                else
                    iRetVal = 2;
                
                if ( (iRetVal==3) && (subGames[i].RateD=='vs') )    
                    iRetVal = 99;
    
                ret = await db.updateTGameSubInfoFinish(subGames[i].subIdx, iHScore, iAScore, iRetVal);
                if ( ret ) {     
                    if (db.DEF_SERVER != 'KHAN') {
                        await apply_Money_Result(subGames[i].subIdx).then(async (getEventsResponse)=>{    
                            //console.log({getEventsResponse})   
                            //logger.info("apply_Money_Result [success] 승무패 (" +FixtureId + ") " + subGames[i].subIdx);                        
                        }).catch((error)=>{
                            console.log({error})
                            logger.error("apply_Money_Result [fail] 승무패 (" +FixtureId + ") " + subGames[i].subIdx + error); 
                        });
                    }
                    ++retCnt;
                }
            }
            break;

        case 2: //핸디
            subGames = await db.selectTGameSubInfoSimple(iGameIdx, iGameKind, iSpKind, iSPBeAf);
            if (!subGames)
                return 0;

            for (i=0; i<subGames.length; ++i)
            {      
                if (subGames[i].subIdx==0)
                    break;

                if ( Number(subGames[i].RateD)+iHScore == iAScore )
                    iRetVal = 99;
                else if ( (Number(subGames[i].RateD)+iHScore) > iAScore )
                    iRetVal = 1;
                else if ( (Number(subGames[i].RateD)+iHScore) < iAScore )
                    iRetVal = 2;
                
                    
                if (iRetVal>0) {
                    ret = await db.updateTGameSubInfoFinish(subGames[i].subIdx, iHScore, iAScore, iRetVal);

                    if ( ret ) {     
                        if (db.DEF_SERVER != 'KHAN') { 
                            await apply_Money_Result(subGames[i].subIdx).then(async (getEventsResponse)=>{    
                                //logger.info("apply_Money_Result [success] 핸디 (" +FixtureId + ") " + subGames[i].subIdx);                        
                            }).catch((error)=>{
                                console.log({error})
                                logger.error("apply_Money_Result [fail] 핸디 (" +FixtureId + ") " + subGames[i].subIdx + error); 
                            });
                        }
                        ++retCnt;   
                    }                       
                }
            }
            
            break;
        case 3://오버언더
            subGames = await db.selectTGameSubInfoSimple(iGameIdx, iGameKind, iSpKind, iSPBeAf);
            if (!subGames)
                return 0;

            for (i=0; i<subGames.length; ++i)
            {      
                if (subGames[i].subIdx==0)
                    break;

                if ( Number(subGames[i].RateD) == iSumScore )
                    iRetVal = 99;
                else if ( Number(subGames[i].RateD) < iSumScore )
                    iRetVal = 1;
                else if ( Number(subGames[i].RateD) > iSumScore )
                    iRetVal = 2;
                
                    
                if (iRetVal>0) {
                    ret = await db.updateTGameSubInfoFinish(subGames[i].subIdx, iHScore, iAScore, iRetVal);

                    if ( ret ) {     
                        if (db.DEF_SERVER != 'KHAN') { 
                            await apply_Money_Result(subGames[i].subIdx).then(async (getEventsResponse)=>{    
                                //logger.info("apply_Money_Result [success] 오버언더 (" +FixtureId + ") " + subGames[i].subIdx);                        
                            }).catch((error)=>{
                                console.log({error})
                                logger.error("apply_Money_Result [fail] 오버언더 (" +FixtureId + ") " + subGames[i].subIdx + error); 
                            });
                        }
                        ++retCnt;   
                    }                       
                }
            }            
            break;

    // 	case 4://홀짝
    // 		if (Select_TGameSubInfo_Simple(stzSubGame, iGameIdx, iGameKind, iSpKind, iSPBeAf))
    // 		{
    // 			for (i=0; i<100; ++i)
    // 			{
    // 				if (stzSubGame[i].iSubIdx==0)
    // 					break;				
    // 				
    // 				if ( !Update_TGameSubInfo_Finish(stzSubGame[i].iSubIdx, iHScore, iAScore, iRetVal) )
    // 				{
    // 					if (iSpKind==0)
    // 						sprintf(szBuff, "에러 : %s:%s [홀짝 에러]", stData.stHome.Name, stData.stAway.Name);
    // 					else
    // 						sprintf(szBuff, "에러 : %s:%s [스페셜 홀짝 에러]", stData.stHome.Name, stData.stAway.Name);
    // 					//sprintf(szBuff, "에러 : %s:%s [홀짝 에러]", stData.stHome.Name, stData.stAway.Name);
    // 					LogWrite(szBuff);
    // 				}
    // 			}
    // 		}
    // 		break;
        }
    } catch (e) {
        console.log("doProc_FinishGame Error" + e);   
        logger.error("doProc_updoProc_FinishGamedateGame Error" + e);        
    }

    return retCnt;
}

const doProc_updateGame = async function doProcUpdateGame(gameData, FixtureId, fixture, livescore, periods, statistics)
{      
    let i=0, j=0;
    let posHome=0, posAway=0;
    let retVal=null;
    let iFTHomeScore=0, iFTAwayScore=0;
    let i1stHomeScore=0, i1stAwayScore=0;
    let i5InningtHomeScore=0, i5InningAwayScore=0;
	let i2ndHomeScore=0, i2ndAwayScore=0;
	let i3rdHomeScore=0, i3rdAwayScore=0;
	let iETHomeScore=0, iETAwayScore=0;
    let i1innSumScore=0;
    let i5inningSumScore=0;

	let iVollyHomeScore=0, iVollyAwayScore=0;

	let iHockyHomeScore=0, iHockyAwayScore=0;

	let iNS_GameIdx = 0;
	let iNS_OddState = 0;
	let iNS_ChgGameTime = 0;		
	let iNS_LeagueIdx=0;
	let iNS_NotUsed=0;
    let	bl2H=false, blHT=false, blFT=false, bl3rd=false, bl1Inning=false;
    let iRet=0;
    let cntFinish=0;
    try {

        //if (FixtureId==4141750)
        //    bl2H=false;

       switch (fixture.Sport.Id)
        {
        case DEF_FOOTBALL:	
            // Football
            // Period Id	Description
            // 10	1st Half
            // 20	2nd Half
            // 30	Overtime 1st Half
            // 35	Overtime 2nd Half
            // 50	Penalties
            // 100	Full time
            // 101	Full time after overtime
            // 102	Full time after penalties
            for (i=0; i<periods.length; ++i)
            {
                if (periods[i].Type==10)
                {
                    retVal = checkPosition (periods[i].Results);

                    i1stHomeScore = parseInt(periods[i].Results[retVal.posHome].Value);
                    i1stAwayScore = parseInt(periods[i].Results[retVal.posAway].Value);
                    blHT = periods[i].IsFinished && periods[i].IsConfirmed;
                }
                if (periods[i].Type==20)
                {
                    retVal = checkPosition (periods[i].Results);

                    i2ndHomeScore = parseInt(periods[i].Results[retVal.posHome].Value);
                    i2ndAwayScore = parseInt(periods[i].Results[retVal.posAway].Value);
                    bl2H = periods[i].IsFinished && periods[i].IsConfirmed;
                }
                if (periods[i].Type==100)
                {
                    retVal = checkPosition (periods[i].Results);

                    iFTHomeScore = parseInt(periods[i].Results[retVal.posHome].Value);
                    iFTAwayScore = parseInt(periods[i].Results[retVal.posAway].Value);
                    blFT = periods[i].IsFinished && periods[i].IsConfirmed;
                }
            }
            if ( !blFT && blHT && bl2H )
            {			
                iFTHomeScore = i1stHomeScore+i2ndHomeScore;
                iFTAwayScore = i1stAwayScore+i2ndAwayScore;
                blFT = true;
            }	
            
            if (blFT)
            {
                // 승무패
                iRet = await doProc_FinishGame(FixtureId, gameData.gameIdx, 1, 0, 0, iFTHomeScore, iFTAwayScore);	
                cntFinish = cntFinish + iRet;
                //핸디
                iRet = await doProc_FinishGame(FixtureId, gameData.gameIdx, 2, 0, 0, iFTHomeScore, iFTAwayScore);
                cntFinish = cntFinish + iRet;			
                //오버언더
                iRet = await doProc_FinishGame(FixtureId, gameData.gameIdx, 3, 0, 0, iFTHomeScore, iFTAwayScore);
                cntFinish = cntFinish + iRet;
            }		
        
            //{{ 스페셜(전반)
            if (blHT)
            {
                // 승무패
                iRet = await doProc_FinishGame(FixtureId, gameData.gameIdx, 1, 1, 1, i1stHomeScore, i1stAwayScore);	
                cntFinish = cntFinish + iRet;		
                //핸디
                iRet = await doProc_FinishGame(FixtureId, gameData.gameIdx, 2, 1, 1, i1stHomeScore, i1stAwayScore);	
                cntFinish = cntFinish + iRet;		
                //오버언더
                iRet = await doProc_FinishGame(FixtureId, gameData.gameIdx, 3, 1, 1, i1stHomeScore, i1stAwayScore);	
                cntFinish = cntFinish + iRet;		
            }
            
            //{{ 스페셜(후반)
            if (bl2H)
            {
                // 승무패
                iRet = await doProc_FinishGame(FixtureId, gameData.gameIdx, 1, 1, 2, i2ndHomeScore, i2ndAwayScore);	
                cntFinish = cntFinish + iRet;		
                //핸디
                iRet = await doProc_FinishGame(FixtureId, gameData.gameIdx, 2, 1, 2, i2ndHomeScore, i2ndAwayScore);		
                cntFinish = cntFinish + iRet;	
                //오버언더
                iRet = await doProc_FinishGame(FixtureId, gameData.gameIdx, 3, 1, 2, i2ndHomeScore, i2ndAwayScore);	
                cntFinish = cntFinish + iRet;
            }
            break;

        case DEF_ICEHOCKEY:
            // Ice Hockey
            // Period Id	Description
            // 1	1st Period
            // 2	2nd Period
            // 3	3rd Period
            // 40	Overtime
            // 50	Penalties
            // 100	Full time
            // 101	Full time after overtime
            // 102	Full time after penalties
            for (i=0; i<periods.length; ++i)
            {
                if (periods[i].Type==1)
                {             
                    retVal = checkPosition (periods[i].Results);
                   
                    i1stHomeScore = parseInt(periods[i].Results[retVal.posHome].Value);
                    i1stAwayScore = parseInt(periods[i].Results[retVal.posAway].Value);
                    
                    iHockyHomeScore += parseInt(periods[i].Results[retVal.posHome].Value);
                    iHockyAwayScore += parseInt(periods[i].Results[retVal.posAway].Value);
                    blHT = periods[i].IsFinished && periods[i].IsConfirmed;
                }
                if (periods[i].Type==2)
                {	
                    retVal = checkPosition (periods[i].Results);	

                    iHockyHomeScore += parseInt(periods[i].Results[retVal.posHome].Value);
                    iHockyAwayScore += parseInt(periods[i].Results[retVal.posAway].Value);
                }
                if (periods[i].Type==3)
                {				
                    retVal = checkPosition (periods[i].Results);	

                    iHockyHomeScore += parseInt(periods[i].Results[retVal.posHome].Value);
                    iHockyAwayScore += parseInt(periods[i].Results[retVal.posAway].Value);
                }
                if (periods[i].Type==100)
                {
                    retVal = checkPosition (periods[i].Results);

                    iFTHomeScore = parseInt(periods[i].Results[retVal.posHome].Value);
                    iFTAwayScore = parseInt(periods[i].Results[retVal.posAway].Value);

                    blFT = periods[i].IsFinished && periods[i].IsConfirmed;
                }                
            }		
            
            if (blFT)  {
                // 승무패
                iRet = await doProc_FinishGame(FixtureId, gameData.gameIdx, 1, 0, 0, iHockyHomeScore, iHockyAwayScore);	
                cntFinish = cntFinish + iRet;		
                //핸디
                iRet = await doProc_FinishGame(FixtureId, gameData.gameIdx, 2, 0, 0, iHockyHomeScore, iHockyAwayScore);	
                cntFinish = cntFinish + iRet;		
                //오버언더
                iRet = await doProc_FinishGame(FixtureId, gameData.gameIdx, 3, 0, 0, iHockyHomeScore, iHockyAwayScore);
                cntFinish = cntFinish + iRet;
            }		
            
            //{{ 스페셜(전반)
            if (blHT) {
                // 승무패
                iRet = await doProc_FinishGame(FixtureId, gameData.gameIdx, 1, 1, 1, i1stHomeScore, i1stAwayScore);		
                cntFinish = cntFinish + iRet;	
                //핸디
                iRet = await doProc_FinishGame(FixtureId, gameData.gameIdx, 2, 1, 1, i1stHomeScore, i1stAwayScore);		
                cntFinish = cntFinish + iRet;	
                //오버언더
                iRet = await doProc_FinishGame(FixtureId, gameData.gameIdx, 3, 1, 1, i1stHomeScore, i1stAwayScore);		
                cntFinish = cntFinish + iRet;	
            }        
            break;		
            
        case DEF_BASEBALL:	
            // Baseball
            // Period Id	Description
            // 1	1st Inning
            // 2	2nd Inning
            // 3	3rd Inning
            // 4	4th Inning
            // 5	5th Inning
            // 6	6th Inning
            // 7	7th Inning
            // 8	8th Inning
            // 9	9th Inning
            // 40	Extra Innings
            // 62	Error
            // 100	Full time
            // 101	Full time after extra time

            for (i=0; i<periods.length; ++i)
            {
                if (periods[i].Type==1)
                {
                    retVal = checkPosition (periods[i].Results);
                   
                    i1stHomeScore = parseInt(periods[i].Results[retVal.posHome].Value);
                    i1stAwayScore = parseInt(periods[i].Results[retVal.posAway].Value);
                    i5InningtHomeScore += parseInt(periods[i].Results[retVal.posHome].Value);
                    i5InningAwayScore += parseInt(periods[i].Results[retVal.posAway].Value);				

                    i1innSumScore = parseInt(periods[i].Results[retVal.posHome].Value) + parseInt(periods[i].Results[retVal.posAway].Value);
                    bl1Inning = true;				
                }
                if (periods[i].Type==2)
                {
                    retVal = checkPosition (periods[i].Results);

                    i5InningtHomeScore += parseInt(periods[i].Results[retVal.posHome].Value);
                    i5InningAwayScore += parseInt(periods[i].Results[retVal.posAway].Value);					
                }
                if (periods[i].Type==3)
                {
                    retVal = checkPosition (periods[i].Results);

                    i5InningtHomeScore += parseInt(periods[i].Results[retVal.posHome].Value);
                    i5InningAwayScore += parseInt(periods[i].Results[retVal.posAway].Value);					
                }	
                if (periods[i].Type==4)
                {
                    retVal = checkPosition (periods[i].Results);

                    i5InningtHomeScore += parseInt(periods[i].Results[retVal.posHome].Value);
                    i5InningAwayScore += parseInt(periods[i].Results[retVal.posAway].Value);					
                }	
                if (periods[i].Type==5)
                {
                    retVal = checkPosition (periods[i].Results);

                    i5InningtHomeScore += parseInt(periods[i].Results[retVal.posHome].Value);
                    i5InningAwayScore += parseInt(periods[i].Results[retVal.posAway].Value);
                    blHT = periods[i].IsFinished && periods[i].IsConfirmed;
                }
                if (periods[i].Type==40)
                {
                    retVal = checkPosition (periods[i].Results);

                    iETHomeScore = parseInt(periods[i].Results[retVal.posHome].Value);
                    iETAwayScore = parseInt(periods[i].Results[retVal.posAway].Value);
                    blHT = periods[i].IsFinished && periods[i].IsConfirmed;
                }
            
                if (periods[i].Type==100)
                {
                    retVal = checkPosition (periods[i].Results);

                    iFTHomeScore = parseInt(periods[i].Results[retVal.posHome].Value);
                    iFTAwayScore = parseInt(periods[i].Results[retVal.posAway].Value);
                    blFT = periods[i].IsFinished && periods[i].IsConfirmed;
                }
            }		
            
            if (blFT)
            {
                // 승무패 (연장포함)
                iRet = await doProc_FinishGame(FixtureId, gameData.gameIdx, 1, 0, 0, iFTHomeScore+iETHomeScore, iFTAwayScore+iETAwayScore);		
                cntFinish = cntFinish + iRet;	
                //핸디(9이닝)
                iRet = await doProc_FinishGame(FixtureId, gameData.gameIdx, 2, 0, 0, iFTHomeScore, iFTAwayScore);			
                cntFinish = cntFinish + iRet;
                //오버언더(9이닝)
                iRet = await doProc_FinishGame(FixtureId, gameData.gameIdx, 3, 0, 0, iFTHomeScore, iFTAwayScore);
                cntFinish = cntFinish + iRet;
            }
            if (bl1Inning)
            {
                // 승무패 (1이닝)
                iRet = await doProc_FinishGame(FixtureId, gameData.gameIdx, 1, 1, 1, i1stHomeScore, i1stAwayScore);	
                cntFinish = cntFinish + iRet;	
                //핸디(1이닝)
                iRet = await doProc_FinishGame(FixtureId, gameData.gameIdx, 2, 1, 1, i1stHomeScore, i1stAwayScore);	
                cntFinish = cntFinish + iRet;
                //오버언더(1이닝)
                iRet = await doProc_FinishGame(FixtureId, gameData.gameIdx, 3, 1, 1, i1stHomeScore, i1stAwayScore);
                cntFinish = cntFinish + iRet;
            }		
            
            
            //{{ 스페셜(5이닝)
            if (blHT)
            {
                // 승무패
                iRet = await doProc_FinishGame(FixtureId, gameData.gameIdx, 1, 1, 50, i5InningtHomeScore, i5InningAwayScore);		
                cntFinish = cntFinish + iRet;	
                //핸디
                iRet = await doProc_FinishGame(FixtureId, gameData.gameIdx, 2, 1, 50, i5InningtHomeScore, i5InningAwayScore);		
                cntFinish = cntFinish + iRet;	
                //오버언더
                iRet = await doProc_FinishGame(FixtureId, gameData.gameIdx, 3, 1, 50, i5InningtHomeScore, i5InningAwayScore);			
                cntFinish = cntFinish + iRet;
            }

            
            /*if (Select_TGameInfo_NS(stData.EventID, stData.StartDate, iNS_GameIdx, iNS_OddState, iNS_ChgGameTime))
            {	
                if (iNS_GameIdx>0)
                {
                    // 득점/무득점 승무패
                    if (i1innSumScore>0)
                        await doProc_FinishGame(FixtureId, stData, iNS_GameIdx, 1, 0, 3, 1, 0);	
                    else
                        await doProc_FinishGame(FixtureId, stData, iNS_GameIdx, 1, 0, 3, 0, 1);	
                }			
            }*/

            break;

        case DEF_BASKETBALL:
            // Basketball
            // Period Id	Description
            // 1	1st Quarter
            // 2	2nd Quarter
            // 3	3rd Quarter
            // 4	4th Quarter
            // 40	Overtime
            // 100	Full time
            // 101	Full time after overtime

            iETHomeScore = 0;
            iETAwayScore = 0;

            for (i=0; i<periods.length; ++i)
            {
                if (periods[i].Type==1)
                {
                    retVal = checkPosition (periods[i].Results);

                    i1stHomeScore = parseInt(periods[i].Results[retVal.posHome].Value);
                    i1stAwayScore = parseInt(periods[i].Results[retVal.posAway].Value);
                    blHT = periods[i].IsFinished && periods[i].IsConfirmed;
                }	
                if (periods[i].Type==3)
                {
                    retVal = checkPosition (periods[i].Results);

                    i3rdHomeScore = parseInt(periods[i].Results[retVal.posHome].Value);
                    i3rdAwayScore = parseInt(periods[i].Results[retVal.posAway].Value);
                    bl3rd = periods[i].IsFinished && periods[i].IsConfirmed;
                }	
                if (periods[i].Type==100)
                {
                    retVal = checkPosition (periods[i].Results);

                    iFTHomeScore = parseInt(periods[i].Results[retVal.posHome].Value);
                    iFTAwayScore = parseInt(periods[i].Results[retVal.posAway].Value);
                    blFT = periods[i].IsFinished && periods[i].IsConfirmed;
                }
                if (periods[i].Type==40)
                {
                    retVal = checkPosition (periods[i].Results);

                    iETHomeScore = parseInt(periods[i].Results[retVal.posHome].Value);
                    iETAwayScore = parseInt(periods[i].Results[retVal.posAway].Value);			
                }
            }		
            
            if (blFT)
            {
                //	승무패 - 연장결과 적용
                //	핸디캡 - 정규(4Q)까지만 인정 
                //	언더/오버 - 정규(4Q)까지만 인정

                // 승무패 (연장포함)
                if (db.DEF_SERVER=='SKY')
                    iRet = await doProc_FinishGame(FixtureId, gameData.gameIdx, 1, 0, 0, iFTHomeScore, iFTAwayScore);		
                else
                iRet = await doProc_FinishGame(FixtureId, gameData.gameIdx, 1, 0, 0, iFTHomeScore+iETHomeScore, iFTAwayScore+iETAwayScore);		

                cntFinish = cntFinish + iRet;	
                //핸디(4쿼터)
                iRet = await doProc_FinishGame(FixtureId, gameData.gameIdx, 2, 0, 0, iFTHomeScore, iFTAwayScore);			
                cntFinish = cntFinish + iRet;
                //오버언더(4쿼터)
                iRet = await doProc_FinishGame(FixtureId, gameData.gameIdx, 3, 0, 0, iFTHomeScore, iFTAwayScore);
                cntFinish = cntFinish + iRet;
            }		
            
            //{{ 스페셜(전반)
            if (blHT)
            {
                // 승무패
                iRet = await doProc_FinishGame(FixtureId, gameData.gameIdx, 1, 1, 1, i1stHomeScore, i1stAwayScore);		
                cntFinish = cntFinish + iRet;	
                //핸디
                iRet = await doProc_FinishGame(FixtureId, gameData.gameIdx, 2, 1, 1, i1stHomeScore, i1stAwayScore);			
                cntFinish = cntFinish + iRet;
                //오버언더
                iRet = await doProc_FinishGame(FixtureId, gameData.gameIdx, 3, 1, 1, i1stHomeScore, i1stAwayScore);		
                cntFinish = cntFinish + iRet;	
            }	
            
            //{{ 스페셜(3Q)
            if (bl3rd)
            {
                // 승무패
                cntiRetFinish = await doProc_FinishGame(FixtureId, gameData.gameIdx, 1, 1, 4, i3rdHomeScore, i3rdAwayScore);			
                cntFinish = cntFinish + iRet;
                //핸디
                iRet = await doProc_FinishGame(FixtureId, gameData.gameIdx, 2, 1, 4, i3rdHomeScore, i3rdAwayScore);			
                cntFinish = cntFinish + iRet;
                //오버언더
                iRet = await doProc_FinishGame(FixtureId, gameData.gameIdx, 3, 1, 4, i3rdHomeScore, i3rdAwayScore);		
                cntFinish = cntFinish + iRet;	
            }
            break;

        case DEF_VOLLEYBALL:
            // Volleyball
            // Period Id	Description
            // 1	1st Set
            // 2	2nd Set
            // 3	3rd Set
            // 4	4th Set
            // 5	5th Set
            // 50	Golden Set
            // 100	Full time
            for (i=0; i<periods.length; ++i)
            {
                if (periods[i].Type==1)
                {
                    retVal = checkPosition (periods[i].Results);

                    i1stHomeScore = parseInt(periods[i].Results[retVal.posHome].Value);
                    i1stAwayScore = parseInt(periods[i].Results[retVal.posAway].Value);
                    iVollyHomeScore += parseInt(periods[i].Results[retVal.posHome].Value);
                    iVollyAwayScore += parseInt(periods[i].Results[retVal.posAway].Value);
                    blHT = periods[i].IsFinished && periods[i].IsConfirmed;
                }
                if (periods[i].Type==2)
                {
                    retVal = checkPosition (periods[i].Results);

                    iVollyHomeScore += parseInt(periods[i].Results[retVal.posHome].Value);
                    iVollyAwayScore += parseInt(periods[i].Results[retVal.posAway].Value);
                }	
                if (periods[i].Type==3)
                {
                    retVal = checkPosition (periods[i].Results);

                    iVollyHomeScore += parseInt(periods[i].Results[retVal.posHome].Value);
                    iVollyAwayScore += parseInt(periods[i].Results[retVal.posAway].Value);
                }	
                if (periods[i].Type==4)
                {
                    retVal = checkPosition (periods[i].Results);

                    iVollyHomeScore += parseInt(periods[i].Results[retVal.posHome].Value);
                    iVollyAwayScore += parseInt(periods[i].Results[retVal.posAway].Value);
                }	
                if (periods[i].Type==5)
                {
                    retVal = checkPosition (periods[i].Results);

                    iVollyHomeScore += parseInt(periods[i].Results[retVal.posHome].Value);
                    iVollyAwayScore += parseInt(periods[i].Results[retVal.posAway].Value);
                }	
                if (periods[i].Type==100)
                {
                    retVal = checkPosition (periods[i].Results);

                    iFTHomeScore = parseInt(periods[i].Results[retVal.posHome].Value);
                    iFTAwayScore = parseInt(periods[i].Results[retVal.posAway].Value);
                    blFT = periods[i].IsFinished && periods[i].IsConfirmed;
                }
            }		
            
            if (blFT)
            {
                //	승무패- 최종세트스코어로 결과적용
                //	핸디캡- 경기 종료시 누적된점수로 핸디적용하여 결과적용
                // 승무패
                iRet = await doProc_FinishGame(FixtureId, gameData.gameIdx, 1, 0, 0, iFTHomeScore, iFTAwayScore);			
                cntFinish = cntFinish + iRet;
                //핸디
                iRet = await doProc_FinishGame(FixtureId, gameData.gameIdx, 2, 0, 0, iVollyHomeScore, iVollyAwayScore);		
                cntFinish = cntFinish + iRet;	
                //오버언더
                iRet = await doProc_FinishGame(FixtureId, gameData.gameIdx, 3, 0, 0, iVollyHomeScore, iVollyAwayScore);
                cntFinish = cntFinish + iRet;
            }		
            
            //{{ 스페셜(전반)
            if (blHT)
            {
                // 승무패
                iRet = await doProc_FinishGame(FixtureId, gameData.gameIdx, 1, 1, 1, i1stHomeScore, i1stAwayScore);		
                cntFinish = cntFinish + iRet;	
                //핸디
                iRet = await doProc_FinishGame(FixtureId, gameData.gameIdx, 2, 1, 1, i1stHomeScore, i1stAwayScore);		
                cntFinish = cntFinish + iRet;	
                //오버언더
                iRet = await doProc_FinishGame(FixtureId, gameData.gameIdx, 3, 1, 1, i1stHomeScore, i1stAwayScore);	
                cntFinish = cntFinish + iRet;		
            }	
            break;	
        }

        if (cntFinish > 0)  {
            await db.updateTGameInfoFinish(gameData.gameIdx);
            await db.updateTOddService(0, cntFinish);
            //console.log('cntFinish' + cntFinish);
       
            const szBuff = `게임결과 적용 => (${i1stHomeScore}-${i1stAwayScore}) (${iFTHomeScore}-${iFTAwayScore})`;            
            //1:게임등록, 2:결과적용, 3:배당변경, 4:경고, 5:에러, 6:세부게임등록
            await db.insertOddErr(FixtureId, fixture.Sport.Id, fixture.Participants[0].Name,fixture.Participants[1].Name, szBuff, 2);		
        }
    } catch (e) {
        console.log("doProc_updateGame Error" + e);   
        logger.error("doProc_updateGame Error" + e);   
    }
}

function checkStartDate(szStartDate, iSportsID)
{
    try {
        let iHour=24;
        const statedate = moment(szStartDate,"YYYY-MM-DDTHH:mm:ssZ").add(9, 'hours');
        let rightNow = moment();
       
        switch (iSportsID)
        {
        case DEF_FOOTBALL:
            iHour = g_config.RegHour_foot;
            break;		
        case DEF_BASEBALL:
            iHour = g_config.RegHour_base;
            break;
        case DEF_BASKETBALL:
            iHour = g_config.RegHour_basket;
            break;
        case DEF_VOLLEYBALL:
            iHour = g_config.RegHour_volly;
            break;
        case DEF_ICEHOCKEY:
            iHour = g_config.RegHour_Hockey;
            break;
        }

        rightNow.add(iHour, 'hours');        

        //console.log('시간1: ', statedate.format('YYYY-MM-DD HH:mm:ss'));
        //console.log('시간2: ', rightNow.format('YYYY-MM-DD HH:mm:ss'));

        const minuteGap = moment.duration(rightNow.diff(statedate)).asMinutes();
        //console.log('분 차이: ', minuteGap);

        if (minuteGap>=0)
            return true;

        return false;
    } catch (e) {
        console.log("checkStartDate Error" + e);   
        logger.error("checkStartDate Error" + e);   
    }

    return false;

}

const doProc_Marketupdate0 = async function doMarketupdate(events)
{
    let i=0; j=0, k=0, m=0;
    let iHo_auto = 0, iOu_auto=0; 
    let retVal = null;
    let iCount = 0;
    const bar1 = new _cliProgress.Bar({}, _cliProgress.Presets.shades_classic);
    bar1.start(events.length, 0);

    try {
        for (i=0; i<events.length; ++i)
        {
            bar1.update(i+1);
            
            for (j=0; j<events[i].Fixture.Participants.length; ++j) {
                events[i].Fixture.Participants[j].Name = events[i].Fixture.Participants[j].Name.replace(/'/g,"");
            }
            events[i].Fixture.League.Name = events[i].Fixture.League.Name.replace(/'/g,"");
           
            let FixtureId = events[i].FixtureId;
            let fixture = events[i].Fixture;
            let livescore = events[i].Livescore;
            let periods = null;            
            let statistics = null;
            let markets = events[i].Markets;
            
            let gameData = null;  
            let leagueData= null;   

            const chkStart = checkStartDate(fixture.StartDate, fixture.Sport.Id);
            if (!chkStart)
                continue;

            if (livescore) {
                periods = events[i].Livescore.Periods;
                statistics = events[i].Livescore.Statistics;
            }

            //console.log('FixtureId' + FixtureId);
            /* Fixture/Scoreboard Status
            Id	Value	Description
            1	Not started yet	The event has not started yet
            2	In progress	The event is live
            3	Finished	The event is finished
            4	Cancelled	The event has been cancelled
            5	Postponed	The event has been postponed
            6	Interrupted	The event has been interrupted
            7	Abandoned	The event has been abandoned
            8	Coverage lost	The coverage for this event has been lost
            9	About to start	The event has not started but is about to. NOTE: This status will be shown up to 30 minutes before the event has started*/
            if (fixture.Status==1 || fixture.Status==9) { 
                //if (FixtureId==4120627)
                //    FixtureId=4120627;

                retVal = await doProc_Game(events[i]);

                if (!retVal)
                    continue;

                gameData = retVal.gameData;
                leagueData = retVal.leagueData;   
                
                if ( !gameData ) 
                    continue;

                retVal = await doProc_GameSub(gameData, fixture, markets);
               
            } else if (fixture.Status==2) { // In progress
                if (!periods)
                    continue;
                    
                if ( ( (fixture.Sport.Id==DEF_FOOTBALL) && (periods.length==1) && (periods[0].Type==10)  && periods[0].IsConfirmed && periods[0].IsFinished )	|| //축구용
                    ( (fixture.Sport.Id!=DEF_FOOTBALL) && (periods.length>=1) && (periods.length<=2) && (periods[0].Type==1) && periods[0].IsConfirmed && periods[0].IsFinished ) )	
                {
                    const gameTmp = await db.selectTGameInfo2(FixtureId, fixture.StartDate);

                    if (!gameTmp)
                        continue;

                    if (gameTmp.gameIdx==0)
                        continue;                   
                        
                    switch (fixture.Sport.Id)
                    {
                    case DEF_FOOTBALL:					
                        break;
                    case DEF_BASKETBALL:					
                        break;
                    case DEF_ICEHOCKEY:				
                        break;		
                    case DEF_BASEBALL:	
                        continue;
                        break;
                    case DEF_VOLLEYBALL:					
                        break;
                    }
                        
                    if (gameTmp.oddState==3)
                    {
                        iCount = await db.countTGameSubInfo(gameTmp.gameIdx, 1, 1);					
                        if (iCount==0)
                            continue;
                    }
                    if (gameTmp.startedGame==0)
                        continue;				
                   
                    //Update_Game(stData, iGameIdx);			
                    retVal = await doProc_updateGame(gameTmp, FixtureId, fixture, livescore, periods, statistics);           	
                }
            

            } else if (fixture.Status==3) { //Finished
                const gameData = await db.selectTGameInfo2(FixtureId, fixture.StartDate);

                if (!gameData)
                    continue;
                
                if (gameData.gameIdx==0)
                    continue;
                if (gameData.oddState==3)
                {
                    iCount = await db.countTGameSubInfo(gameData.gameIdx, 0, 0);		
                    if (iCount==0)
                        continue;
                }
                if (gameData.startedGame==0)
                    continue;

                retVal = await doProc_updateGame(gameData, FixtureId, fixture, livescore, periods, statistics);           

            } else if (fixture.Status==4) { // Cancelled                 
                //console.log("Cancelled: " + FixtureId + ' ' + fixture.Participants[0].Name + ' vs ' + fixture.Participants[1].Name);   
                //logger.info("Cancelled: " + FixtureId + ' ' + fixture.Participants[0].Name + ' vs ' + fixture.Participants[1].Name);   
                continue;
            } else if (fixture.Status==5) { // Postponed               
                //console.log("Postponed: " + FixtureId + ' ' + fixture.Participants[0].Name + ' vs ' + fixture.Participants[1].Name);   
                //logger.info("Postponed: " + FixtureId + ' ' + fixture.Participants[0].Name + ' vs ' + fixture.Participants[1].Name);                  
                continue;
            } else if (fixture.Status==6) { // Interrupted               
                //console.log("Interrupted: " + FixtureId + ' ' + fixture.Participants[0].Name + ' vs ' + fixture.Participants[1].Name);   
                //logger.info("Interrupted: " + FixtureId + ' ' + fixture.Participants[0].Name + ' vs ' + fixture.Participants[1].Name);                     
                continue;
            } else if (fixture.Status==7) { // Abandoned                   
                //console.log("Abandoned: " + FixtureId + ' ' + fixture.Participants[0].Name + ' vs ' + fixture.Participants[1].Name);   
                //logger.info("Abandoned: " + FixtureId + ' ' + fixture.Participants[0].Name + ' vs ' + fixture.Participants[1].Name);                   
                continue;
            } else if (fixture.Status==8) { // Coverage lost               
                //console.log("Coverage lost : " + FixtureId + ' ' + fixture.Participants[0].Name + ' vs ' + fixture.Participants[1].Name);   
                //logger.info("Coverage lost : " + FixtureId + ' ' + fixture.Participants[0].Name + ' vs ' + fixture.Participants[1].Name);                 
                continue;
            }
            
            
        }
    } catch (e) {
        console.log("doMarketupdate Error" + e);   
        logger.error("doMarketupdate Error" + e);   
    }
    bar1.stop();
    console.log("completed doMarketupdate ....");
}



// ===============================================================================
// =====================For Test==================================================
// ===============================================================================
// const initialize = async () => {
//     await db.connect();
//     //glCurrencyCodes = await db.selectCurrency();   
// };

// initialize();

// const msg = '{"Header":{"Type":2,"MsgId":373,"MsgGuid":"91e550fd-60e3-44f6-aeda-be6e5f7b9b26","ServerTimestamp":1546853268},"Body":{"Events":[{"FixtureId":4155266,"Livescore":{"Scoreboard":{"Status":2,"CurrentPeriod":3,"Time":"52","Results":[{"Position":"1","Value":"66"},{"Position":"2","Value":"57"}]},"Periods":[{"Type":1,"IsFinished":true,"IsConfirmed":true,"Results":[{"Position":"1","Value":"25"},{"Position":"2","Value":"21"}],"Incidents":null},{"Type":2,"IsFinished":true,"IsConfirmed":true,"Results":[{"Position":"1","Value":"23"},{"Position":"2","Value":"21"}],"Incidents":null},{"Type":3,"IsFinished":false,"IsConfirmed":false,"Results":[{"Position":"1","Value":"18"},{"Position":"2","Value":"15"}],"Incidents":null}],"Statistics":[{"Type":31,"Results":[{"Position":"1","Value":"4"},{"Position":"2","Value":"3"}],"Incidents":null},{"Type":32,"Results":[{"Position":"1","Value":"14"},{"Position":"2","Value":"18"}],"Incidents":null},{"Type":12,"Results":[{"Position":"1","Value":"8"},{"Position":"2","Value":"4"}],"Incidents":null},{"Type":28,"Results":[{"Position":"1","Value":"17"},{"Position":"2","Value":"12"}],"Incidents":null},{"Type":30,"Results":[{"Position":"1","Value":"6"},{"Position":"2","Value":"5"}],"Incidents":null}],"LivescoreExtraData":[]},"Markets":null}]}}';
// // const akFile = async function doFile() {
// //     try {
// //         console.log('파일읽기프로세스시작...');
// //         fs.readFile('./shot.json', function (err, data) {
// //             var content = JSON.parse(data);
// //             console.log('data:' + content);
// //             console.log(content);
// //             doMarketupdate(content.Body.Events);
// //         });

    
// //     }catch (e) {
// //         console.log("doMarketupdate Error" + e);   
// //     }
// // } 
// const akMsg = async function doMsg() {
//     try {       
//             var content = JSON.parse(msg);
//             console.log('data:' + content);
//             console.log(content);
//             doProc_Marketupdate0(content.Body.Events);    
//     }catch (e) {
//         console.log("doMarketupdate Error" + e);   
//     }
// } 
// setTimeout(akMsg, 1000);
// ===============================================================================




var arrProc = new Array(); //배열선언
arrProc[0] = doProc_Marketupdate0;
arrProc[1] = doProc_Marketupdate0;
arrProc[2] = doProc_Marketupdate0;
arrProc[3] = doProc_Marketupdate0;
arrProc[4] = doProc_Marketupdate0;
arrProc[5] = doProc_Marketupdate0;
arrProc[6] = doProc_Marketupdate0;
arrProc[7] = doProc_Marketupdate0;
arrProc[8] = doProc_Marketupdate0;
arrProc[9] = doProc_Marketupdate0;


// WaitQueue
// there's no task here 
// worker loop
function run_worker(id, time){
    var loop = function(){
        // get item at the front of the queue
        wq.pop()
        .then(async (item)=>{
            console.log('worker-' + id, '  queue-len', wq.queue.length);
            //console.log('  queue-len', wq.queue.length, 'item', item);      
            function doProcess(callback) {
                // new Promise() 추가
                return new Promise(function (resolve, reject) {
                    
                    if (item.Header.Type==3)
                    {
                        console.log(item.Header.Type); 
                    }
                    doProc(id, item).then(()=>{
                        resolve();
                    }).catch((error)=>{
                        console.log({error})
                    })
                });
            } 
            doProcess().then(function () {
                // resolve()의 결과 값이 여기로 전달됨
                //console.log('========Queue처리===========');
                //await doProc(item);
                setTimeout(loop, time);
                 
            }).catch((error)=>{
                console.log({error});
                setTimeout(loop, time);
            });              
        })
    }
    loop();
}

// worker-a use 1s every task
run_worker(0, 500);
run_worker(1, 500);
run_worker(2, 500);
run_worker(3, 500);
run_worker(4, 500);
run_worker(5, 500);
run_worker(6, 500);
run_worker(7, 500);
run_worker(8, 500);
run_worker(9, 500);


module.exports={
    wq,
    setConfig,//g_config
    setMarketInfo,
    //lsportInPlay,
    //lsportPreMatch
}