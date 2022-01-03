const amqlib = require('amqplib');


const { logger } = require('../logger');
// var logger = require('./logger'); // 방금 추가한 logger.js 
const db = require('../db');
const moment = require('moment');

// WaitQueue
//const WaitQueue = require('wait-queue')
//const wq = new WaitQueue

//const prematchWorker = require('../prematchWorker')
//const liveWorker = require('../liveWorker')
const myRabbitMQ = require('../dist_connRabbitMQ');

var fs = require('fs');

// const initialize = async () => {
//     await db.connect();
//     //glCurrencyCodes = await db.selectCurrency();
//     console.log('========1. 패키지 Enable===========');
// };

// initialize();

/*const LSPORT_USER_NAME = 'komyeongsuk1004@gmail.com';
const LSPORT_PASSWORD = 'DDFGY63mfgD';
const LSPORT_INPLAY_QUEUE = '_1936_';
const LSPORT_PREMATCH_QUEUE = '_582_';*/

const LSPORT_USER_NAME = 'carwinner23@gmail.com';
const LSPORT_PASSWORD = 'pzcr5tg7xdDR430';
const LSPORT_INPLAY_QUEUE = '_2197_';
const LSPORT_PREMATCH_QUEUE = '_2196_';

let heartBeat_ServerTimestamp;



// Normal Array
// var array = []
// console.log(array.shift())
// // undefined
// array.push('foo')
// console.log(array.shift())

// const aa = array.pop()
// console.log(aa)
// // "foo"


// run_worker('03', 500);
// run_worker('04', 500);
// run_worker('05', 500);

// run_worker('06', 500);
// run_worker('07', 500);
// run_worker('08', 500);
// run_worker('09', 500);
// run_worker('10', 500);

// add a task every 500ms
// for(var n=0; n<20; n++){
//     wq.push(n)
// }

const lsportInPlay =  ()=>{
    amqlib.connect({
        protocol: 'amqp',
        hostname: 'inplay-rmq.lsports.eu',
        port: 5672,
        username: 'carwinner23@gmail.com',
        password: 'pzcr5tg7xdDR430',
        locale: 'en_US',
        heartbeat: 580,
        vhost: 'Customers',
    }).then( (connectionEstablished)=>{
        connectionEstablished.createChannel().then( (lsportChannel)=>{
            lsportChannel.consume(LSPORT_INPLAY_QUEUE, async (lsportMessage)=>{

                /**
                 * This Is The message from Lsport
                 * the message is Buffer , use toString
                 * @type {string}
                 */

                let lsportPreMatchMessage = lsportMessage.content.toString();

                console.log('PUBLISHER =>' + lsportPreMatchMessage);

                let content = JSON.parse(lsportPreMatchMessage);
                               
                //async function bbbb(data) {      
                //    liveWorker.wq.push(content);
                //}
                myRabbitMQ.publish("", "server1", new Buffer(lsportPreMatchMessage));
                
                // const gameIdx =  await db.selectTLiveGameLS_ReadFlag();
                // console.log(gameIdx);

            },{consumer:'consumer',noAck:true})
        }).catch((channelCreationError)=>{
            console.log({channelCreationError})
        })
    }).catch((connectionError)=>{
        console.log({connectionError})
    })
};
/*
<Message>
lsportConnect.js:582
  <Header>
    <Type>3</Type>
    <MsgId>2</MsgId>
    <MsgGuid>5952ef06-7abe-48e2-9ba3-f2d563fdfec3</MsgGuid>
    <ServerTimestamp>1550658086</ServerTimestamp>
  </Header>
  <MessageBody>
    <Events>
      <Event FixtureId="4339291">
        <Markets>
          <Market Id="101" Name="Under/Over - Home Team">
            <Provider Id="74" Name="MarathonBet" LastUpdate="2019-02-20T10:21:26.520Z">
              <Bet Id="2966974824339291" Name="Over" Line="1.5" BaseLine="1.5" Status="1" StartPrice="1.0" Price="2.11" LastUpdate="2019-02-20T10:21:25.160Z" />
              <Bet Id="6999820094339291" Name="Over" Line="1.0" BaseLine="1.0" Status="1" StartPrice="1.0" Price="1.43" LastUpdate="2019-02-20T10:21:25.160Z" />
              <Bet Id="10264364314339291" Name="Under" Line="1.0" BaseLine="1.0" Status="1" StartPrice="1.0" Price="2.66" LastUpdate="2019-02-20T10:21:25.160Z" />
              <Bet Id="10264364284339291" Name="Under" Line="1.5" BaseLine="1.5" Status="1" StartPrice="1.0" Price="1.666" LastUpdate="2019-02-20T10:21:25.160Z" />
*/
const lsportPreMatch = ()=>{
    amqlib.connect({
        protocol: 'amqp',
        hostname: 'prematch-rmq.lsports.eu',
        port: 5672,
        username: 'dnjsrur81@nate.com',
        password: '9d4f2c02',
        locale: 'en_US',
        heartbeat: 580,
        vhost: 'Customers',
    }).then((connectionEstablished)=>{
        connectionEstablished.createChannel().then((lsportChannel)=>{
            lsportChannel.consume(LSPORT_PREMATCH_QUEUE,(lsportMessage)=>{

                /**
                 * This Is The message from Lsport
                 * the message is Buffer , use toString
                 * @type {string}
                 */
                let lsportPreMatchMessage = lsportMessage.content.toString();

                console.log(lsportPreMatchMessage);

                let content = JSON.parse(lsportPreMatchMessage);
                               
                //async function bbbb(data) {      
                    prematchWorker.wq.push(content);
                //}

                //await bbbb(content);

            },{consumer:'consumer',noAck:true})
        }).catch((channelCreationError)=>{
            console.log({channelCreationError})
        })
    }).catch((connectionError)=>{
        console.log({connectionError})
    })
};

module.exports={
    lsportInPlay,
    lsportPreMatch
}