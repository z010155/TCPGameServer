"use strict"

class Client {
	constructor(socket, server) {
		this.socket = socket
		this.server = server
		this.database = server.database

		this.ipAddr = socket.remoteAddress.split(":").pop()
	}

	setClient(client) {
		this.ID = client.ID
		this.username = client.username
		this.registered = client.registered
		this.moderator = Boolean(client.moderator)
		this.banned = Boolean(client.banned)
		this.room = 0
	}

	sendRaw(data) {
		if (this.socket && this.socket.writable) {
			this.server.logger.outgoing(data)

			this.socket.write(data + "\0")
		}
	}

	sendXt() {
		this.sendRaw(`%xt%${Array.prototype.join.call(arguments, "%")}%`)
	}

	sendError(err, disconnect) {
		this.sendXt("e", -1, err)

		if (disconnect) {
			this.disconnect()
		}
	}

	disconnect() {
		this.server.removeClient(this)
	}

	updateColumn(column, value) {
		this.database.updateColumn(this.ID, column, value).catch((error) => {
			this.server.logger.error(error)
		})
	}

	getColumn(column) {
		return this.database.getColumn(this.ID, column)
	}
}

module.exports = Client