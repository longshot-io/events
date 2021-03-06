import client = require("./client");
import log = require("ls-logger");
export = subscribe;

//TODO: Needs refactoring
function subscribe(channels: string|string[], callback: (channel: string, message: any) => void) {
	var redisClient = client();

	redisClient.on("psubscribe", (channel, count) => {
		log.debug("[SUB]' Subscribed to " + channel + "' (" + count + ")");
	});

	redisClient.on("pmessage", (channel, message) => {
		callback(channel, message);
	});

	var subPromise = new Promise((resolve, reject) => {
		redisClient.on("ready", () => {
			if (channels instanceof Array)
				channels.forEach(c => redisClient.psubscribe(c));
			else redisClient.psubscribe(channels);
			resolve(Promise.resolve(true));
		});

		redisClient.on("error", err => {
			reject(err);
		});
	});
	return subPromise;
}
