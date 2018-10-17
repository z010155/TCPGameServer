"use strict"

const Config = require("../config")

const Client = require("./client")
const Handler = require("./packets/handler")
const Database = require("./system/database")

class Server {
	constructor() {
		this.port = Config.Server.Port

		this.clients = []

		this.logger = require("./utils/logger")

		this.database = new Database(Config.Database)
		this.handler = new Handler(this)

		this.startServer()

		process.on("SIGINT", () => this.handleShutdown())
		process.on("SIGTERM", () => this.handleShutdown())
	}

	startServer() {
		require("net").createServer((socket) => {
			socket.setEncoding("utf8")
			socket.setNoDelay(true)
			socket.setTimeout(600000, () => {
				socket.end("An inactive socket has been disconnected")
			})

			const client = new Client(socket, this)

			if (this.clients.length >= Config.Server.MaxClients) {
				this.logger.info(`${client.ipAddr} has been disconnected because the server is full (${this.clients.length} clients online)`)

				client.disconnect()
			} else {
				this.logger.info(`${client.ipAddr} connected`)

				this.clients.push(client)
			}

			socket.on("data", (data) => {
				data = data.toString().split("\0")[0]

				this.logger.incoming(data)

				if (data.charAt(0) === "<" && data.slice(-1) === ">") {
					this.handler.handleXML(data, client)
				} else if (data.charAt(0) === "%" && data.slice(-1) === "%") {
					this.handler.handleXT(data, client)
				} else {
					this.logger.error(`${client.ipAddr} has been disconnected because the server received an invalid packet`)

					client.disconnect()
				}
			})

			socket.on("close", () => {
				this.logger.info(`${client.ipAddr} has been disconnected`)

				client.disconnect()
			})

			socket.on("error", (error) => {
				if (error.code === "ETIMEDOUT" || error.code === "ECONNRESET") {
					return
				}

				this.logger.error(error)
			})
		}).listen(this.port, () => {
			this.logger.info(`TCPGameServer made by Zaseth listening on port ${this.port}`)
		})
	}

	removeClient(client) {
		const index = this.clients.indexOf(client)

		if (index > -1) {
			this.clients.splice(index, 1)

			client.socket.end()
			client.socket.destroy()
		}
	}

	handleShutdown() {
		if (this.clients.length > 0) {
			this.logger.info(`Shutting down and disconnecting ${this.clients.length} clients`)

			setTimeout(() => {
				for (const client of this.clients) {
					client.disconnect()
				}

				process.exit(0)
			}, 3000)
		} else {
			process.exit(0)
		}
	}

	getClient(player) {
		const type = isNaN(player) ? "username" : "ID"

		for (const client of this.clients) {
			if (type === "username" && client.username === player) {
				return client
			} else if (type === "ID" && client.ID === player) {
				return client
			}
		}
	}

	isClientOnline(player) {
		const type = isNaN(player) ? "username" : "ID"

		for (const client of this.clients) {
			if (type === "username" && client.username === player) {
				return true
			} else if (type === "ID" && client.ID === player) {
				return true
			}
		}

		return false
	}
}

module.exports = Server