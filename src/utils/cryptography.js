"use strict"

class Cryptography {
	static hashPassword(pass) {
		return require("keccak")("keccak256").update(pass).digest("hex")
	}

	static generateRandomKey(len) {
		return require("crypto").randomBytes(len / 2).toString("hex")
	}
}

module.exports = Cryptography