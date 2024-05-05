import express from 'express'
import Rcon from './rcon.js'
import config from './config.json' assert { type: 'json' };

const app = express()
// app.use(session)
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
    this.playerCount = null;
    this.playerList = null;
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
}

const server = new Server()

app.get('/api/serverInfo', async (req, res) => {
  const info = server.serverInfo.data

  const infoToSend = {
    name: info.ServerName_s,
    maxPlayers: info.MaxPlayers,
    currentPlayers: Number(info.PlayerCount_I),
    gameMode: info.GameMode_s,
    map: info.MapName_s,
    nextMap: info.NextLayer_s
  }

  res.json(infoToSend)
})


app.get('/api/playerCount', async (req, resp) => {
  const serverInfo = server.serverInfo
  const playerCount = { playercount: Number(serverInfo.data.PlayerCount_I) }
  // Log the request source
  console.log('Sending player count to client: ')
  console.log(`IP: ${req.ip}`);
  resp.json(playerCount)
})

app.get('/api/playerList', async (req, res) => {
  console.log('Sending player list to client: ')
  let players = []
  try {
    for (const player of server.playerList) {
      let tempPlayer = { name : player.name, steamID: player.steamID}
      players.push(tempPlayer)
      // console.log(player)
    }
    res.json(players)
  } catch (e) {
    res.status(500).send('Internal server error occured.')
  }
})



async function logRequestSource(req) {

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

