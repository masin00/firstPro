
const moment = require('moment');

const log = require('../lib/log');
const { logger } = require('../logger');

const DEF_DB_USER = 'momuser787';
const DEF_DB_PASSWORD = '!@#dbwj45^&*';
const DEF_DB_SERVER = '127.0.0.1';
const DEF_DB_NAME = 'UserDB';

const DEF_SERVER = 'SKY';
const DEF_GAME_TYPE = 'FX1';




const sql = require('mssql');

const config = {
  user: DEF_DB_USER,
  password: DEF_DB_PASSWORD,
  server: DEF_DB_SERVER, // You can use 'localhost\\instance' to connect to named instance
  database: DEF_DB_NAME,

  options: {
    // encrypt: true // Use this if you're on Windows Azure
  }
};

module.exports = (function () {

  function connect () {
    return sql.connect(config).then(
      // console.log('Successfully connected to mongodb');
      () => {
        log.info('GameDB : Successfully connected to MS_SQL');
      }    
    ).catch(err => {
      log.error('err', err);
      logger.error('[connect] err:', err);
    });
  }

  function disconnect () {
    return sql.close();
  }


  

  // retuen 0: 에러, 1:성공, 
  async function Select_TProcGame() {
    let ssql = "";

    try {  
      ssql = `SELECT TOP 1 idx, gameType,kind,subIdx FROM TProcGame Where state=0;`;
      let result = await new sql.Request().query(ssql);       
      // console.log(result.recordset);
      if (result.recordset.length>0)     
        return result.recordset[0];
      
      return 0;
    } catch (err) {
      // ... error checks
      if (err) {
        log.error('err:', err);
        logger.error('[Select_TProcGame] err:' + err+ " (" + ssql + ")") ;
        return 0;
      }
    }
  }

   


  async function Update_TProcGame(idx, state) {
    let ssql = "";

    try {     
      ssql = `UPDATE TProcGame SET state = ${state} WHERE idx= ${idx};`;
      
      await new sql.Request().query(ssql);     
      return 1;
    } catch (err) {
      // ... error checks
      if (err) {
        log.error('err:', err);
        logger.error('[Update_TProcGame] err:' + err+ " (" + ssql + ")") ;
        return 0;
      }
    }
  }

 

  return {
    DEF_SERVER,
    DEF_DB_SERVER,
    DEF_GAME_TYPE,
    
    connect,  
    disconnect,

    Select_TProcGame,
    Update_TProcGame,    
    
  };
})();
