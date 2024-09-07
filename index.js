import express from 'express'
import Rcon from './rcon.js'
import config from './config.json' assert { type: 'json' };

const app = express()
app.use(express.urlencoded({extended: true}))
app.use(express.json())


class Server {
  constructor() {
    this.rcon = new Rcon({
      host: config.rconIP,
      port: config.rconPort,
      password: config.rconPassword
    })
    this.getInfo = this.getInfo.bind(this)
    this.serverInfo = null;
    this.nextMapData = null;
    this.currentMapData = null;
    this.playerCount = null;
    this.playerList = null;
    this.updateTime = null;
  }

  async run() {
    await this.getInfo()
    setInterval(this.getInfo, config.updateIntervalSeconds * 1000 || 30000)
  }

  async getInfo() {
    console.log('Retrieving info from the server...')
    await this.rcon.connect()
    await this.retrieveServerInfo()
    await this.retrievePlayerList()
    this.currentMapData = await this.retrieveCurrentMap()
    this.nextMapData = await this.retrieveNextMap()
    this.updateTime = new Date(Date.now())
    this.serverInfo.data.currentMap = this.currentMapData.layer
    this.serverInfo.data.nextMap = this.nextMapData.layer
    await this.rcon.disconnect()
  }

  async retrieveServerInfo() {
    const data = await this.rcon.execute('ShowServerInfo')
    if (data) { this.serverInfo = { data: JSON.parse(data), timeUpdated: new Date()}}
  }

  async retrievePlayerList() {
    const rawData = await this.rcon.execute('ListPlayers')
    let players = []

    if (!rawData || !rawData.length) return;

    for (const line of rawData.split('\n')) {
      const match = line.match(
        /^ID: (?<playerID>\d+) \| Online IDs: EOS: (?<eosID>[a-f\d]{32}) (?:steam: (?<steamID>\d{17}) )?\| Name: (?<name>.+) \| Team ID: (?<teamID>\d|N\/A) \| Squad ID: (?<squadID>\d+|N\/A) \| Is Leader: (?<isLeader>True|False) \| Role: (?<role>.+)$/
      );
      if (!match) continue;

      const data = match.groups;
      data.playerID = +data.playerID;
      data.isLeader = data.isLeader === 'True';
      data.teamID = data.teamID !== 'N/A' ? +data.teamID : null;
      data.squadID = data.squadID !== 'N/A' ? +data.squadID : null;

      players.push(data);
    }

    this.playerList = players
  }

  async retrieveCurrentMap() {
    const data = await this.rcon.execute('ShowCurrentMap');
    const match = data.match(/^Current level is (.*), layer is (.*), factions (.*)/);
    return { level: match[1], layer: match[2], factions: match[3]};
  }

  async retrieveNextMap() {
    const data = await this.rcon.execute('ShowNextMap');
    const match = data.match(/^Next level is (.*), layer is (.*), factions (.*)/);
    return {
      level: match ? (match[1] !== '' ? match[1] : null) : null,
      layer: match ? (match[2] !== 'To be voted' ? match[2] : null) : null,
      factions: match ? (match[3] !== '' ? match[3] : null) : null
    };
  }
}

const server = new Server()



app.get('/api/', async (req, res) => {
  // console.log(req.headers["user-agent"])
  res.redirect('/api/serverInfo')
})


app.get('/api/serverInfo', async (req, res) => {
  const info = server.serverInfo.data
  const updateTime = server.updateTime
  // TODO add user agent to logging.
  // console.log(req.headers["user-agent"])
  const serverInfo = {
    name: info.ServerName_s,
    maxPlayers: info.MaxPlayers,
    currentPlayers: Number(info.PlayerCount_I),
    currentPlayersInQueue: Number(info.PublicQueue_I),
    currentVIPsInQueue: Number(info.ReservedQueue_I),
    gameMode: info.GameMode_s,
    currentMap: info.currentMap,
    nextMap: info.nextMap,
    updateTime: updateTime
  }
  res.json(serverInfo)
})


app.get('/api/playerCount', async (req, res) => {
  try {
    const serverInfo = server.serverInfo
    const updateTime = server.updateTime
    const playerCount = {
      playercount: Number(serverInfo.data.PlayerCount_I),
      updateTime: updateTime
    }
    console.log('Sending player count to client: ')
    console.log(`IP: ${req.ip}`);
    res.json(playerCount)
  } catch (err) {
    res.status(500).send('Internal server error occured.')
  }
})

app.get('/api/playerList', async (req, res) => {
  const updateTime = server.updateTime
  console.log('Sending player list to client: ')
  let players = []
  try {
    for (const player of server.playerList) {
      let tempPlayer = {
        name : player.name,
        steamID: player.steamID,
        teamID: player.teamID,
        isLeader: player.isLeader,
        role: player.role
      }
      players.push(tempPlayer)
    }
    res.json({
      players: players, updateTime: updateTime
    })
  } catch (e) {
    res.status(500).send('Internal server error occurred.')
    console.log('Error occured when retrieving the playerlist.')
    console.log(e)
  }
})

app.get('/api/ping', async (req, res) => {
  logRequestSource(req, 'ping')
  console.log('Sending ping request recieved, sending response back...')
  try {
    res.send('pong')
  } catch (err) {
    res.status(500).send('Internal server error occured')
    console.log('Error occurred during ping request')
    console.log(err)
  }
})


async function logRequestSource(req, route) {
  console.log(`Recieved request from: ${req.ip}. Route: ${route}`)
}



async function main() {
  await server.run()

  app.listen(config.webServerPort, () => {
    console.log(`Server up, listening on port ${config.webServerPort}`)
  })


  // app.listen(config.webServerPort, () => {
  //   console.log(`Server up, listening on port ${config.webServerPort}`)
  // })
  //
  // const RCON = new Rcon({
  //     host: config.rconIP,
  //     port: config.rconPort,
  //     password: config.rconPassword
  //   })
  //
  // await RCON.connect()
  // let result = await RCON.execute('ShowServerInfo')
  // result = JSON.parse(result)
  // await RCON.disconnect()
  // if (result)
  // console.log(result)
}

main()

