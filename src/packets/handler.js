"use strict"

const Cryptography = require("../utils/cryptography")

class Handler {
	constructor(server) {
		this.server = server
		this.database = server.database

		this.failedLogins = {}
	}

	handleLogin_SFS(data, client) {
		const username = data.split("[")[2].split("]")[0]
		const password = data.split("[")[4].split("]")[0]

		if (client.ipAddr.length <= 0) {
			return client.disconnect()
		}

		if (!this.failedLogins[client.ipAddr]) {
			this.failedLogins[client.ipAddr] = []
		}

		if (this.failedLogins[client.ipAddr].length > 30) {
			this.server.logger.info(`${client.ipAddr} has been disconnected because the client failed to login 30 times`)

			return client.disconnect()
		}

		this.database.getPlayer(username).then((result) => {
			if (result.banned >= 1) {
				this.server.logger.info(`${client.ipAddr} has been disconnected because the client is banned`)

				this.failedLogins[client.ipAddr].push(1)

				return client.disconnect()
			}

			const clientObj = this.server.isClientOnline(result.ID)

			if (clientObj) {
				this.failedLogins[client.ipAddr].push(1)

				return clientObj.disconnect()
			}

			if (result.password === Cryptography.hashPassword(password)) {
				this.server.logger.info(`${client.ipAddr} has logged in on the server`)

				if (this.failedLogins[client.ipAddr]) {
					delete this.failedLogins[client.ipAddr]
				} else {
					this.server.logger.info(`${client.ipAddr} has been disconnected because the client somehow bypassed failed login check`)

					this.failedLogins[client.ipAddr].push(1)

					client.disconnect()
				}

				client.setClient(result)
			} else {
				this.server.logger.info(`${client.ipAddr} has been disconnected because the client failed to login`)

				this.failedLogins[client.ipAddr].push(1)

				client.disconnect()
			}
		}).catch((error) => {
			this.server.logger.error(error)

			this.failedLogins[client.ipAddr].push(1)

			return client.disconnect()
		})
	}

	handleXML(data, client) {
		if (data === "<policy-file-request/>") {
			client.sendRaw(`<cross-domain-policy><allow-access-from domain="*" to-ports="*"/></cross-domain-policy>`)
		} else {
			const packetType = data.split("n='")[1].split("'")[0]

			if (packetType === "verChk") {
				client.sendRaw(`<msg t="sys"><body action="apiOK" r="0"></body></msg>`)
			} else if (packetType === "rndK") {
				client.randomKey = Cryptography.generateRandomKey(12)
				client.sendRaw(`<msg t="sys"><body action="rndK" r="-1"><k>${client.randomKey}</k></body></msg>`)
			} else if (packetType === "login") {
				this.handleLogin_SFS(data, client)
			} else {
				client.disconnect()
			}
		}
	}

	handleXT(data, client) {
		data = data.split("%")
		data.shift()

		const packetExtension = data[0]
		const packetType = data[1]
		const packetHandler = data[2]

		if (packetExtension !== "xt" || packetType.length <= 0 || packetHandler.length <= 0) {
			this.server.logger.info(`${client.ipAddr} has been disconnected because the server received an invalid XT packet`)

			return client.disconnect()
		}
	}
}

module.exports = Handler