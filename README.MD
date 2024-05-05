# Squad Info Server

#### About

This program is meant to work as a tiny web API, middleman to retrieve game data about a [Squad](https://store.steampowered.com/app/393380/Squad/) dedicated server, without exposing sensitive secrets such as RCON connection details.

This became necessary as of Squad update 6.0 with the introduction of the EOS(Epic Online Services), which broke direct A2S queries for Squad game servers.

#### Prerequisites
* Node.js (v20.x) - [Download](https://nodejs.org/en/)

#### Installation
* Download the info-server source code.
* Install the dependencies by running <code>npm install </code>
* Configure the <code>config.json</code>

```
WebServerPort: The inbound port for the http requests
rconIP: The IP to connect to RCON on the Squad game server.
rconPort: The Port to connect to RCON on the Squad Game Server
rconPassword: The password used to connect to RCON on the Squad Game Server
updateIntervalSeconds: How often the web server will query the Squad Game Server for data. 
```

* To run, open your terminal and run: <code>node index.js</code>


#### Credits

The RCON module with some modifications, borrowed from [SquadJS](https://github.com/Team-Silver-Sphere/SquadJS)



## License

```
Boost Software License - Version 1.0 - August 17th, 2003

Copyright (c) 2024 Steffen Kaland

Permission is hereby granted, free of charge, to any person or organization
obtaining a copy of the software and accompanying documentation covered by
this license (the "Software") to use, reproduce, display, distribute,
execute, and transmit the Software, and to prepare derivative works of the
Software, and to permit third-parties to whom the Software is furnished to
do so, all subject to the following:

The copyright notices in the Software and this entire statement, including
the above license grant, this restriction and the following disclaimer,
must be included in all copies of the Software, in whole or in part, and
all derivative works of the Software, unless such copies or derivative
works are solely in the form of machine-executable object code generated by
a source language processor.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE, TITLE AND NON-INFRINGEMENT. IN NO EVENT
SHALL THE COPYRIGHT HOLDERS OR ANYONE DISTRIBUTING THE SOFTWARE BE LIABLE
FOR ANY DAMAGES OR OTHER LIABILITY, WHETHER IN CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.
```