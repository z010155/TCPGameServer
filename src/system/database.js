"use strict"

class Database {
	constructor(Config) {
		this.knex = require("knex")({
			client: "mysql2",
			connection: {
				"host": Config.host,
				"user": Config.user,
				"password": Config.pass,
				"database": Config.database
			}
		})
	}

	getPlayer(player) {
		const type = isNaN(player) ? "username" : "ID"

		return this.knex("users").first("*").where(type, player)
	}

	updateColumn(player, column, value) {
		const type = isNaN(player) ? "username" : "ID"

		return this.knex("users").update(column, value).where(type, player).then(() => {

		})
	}

	getColumn(player, column, table) {
		const type = isNaN(player) ? "username" : "ID"

		return this.knex("users").select(column).where(type, player)
	}
}

module.exports = Database