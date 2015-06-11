import client = require("./client");
import Promise = require("bluebird");
import log = require("designco-logger");

import types = require("designco-store");
import AppEvent = types.AppEvent;
import EventType = types.EventType;
import EventContext = types.EventContext;

export = publish;

function publish(event: AppEvent) {
	var redisClient = client();

	redisClient.on("connect", () => {
		var channel = eventToChannel(event);
		var message = JSON.stringify(event.data);
		var store = eventToListName(event);
		var storableEvent = eventToStorable(event);

		var multi = redisClient.multi([
			["zadd", "events", Date.now(), JSON.stringify(storableEvent)],
			["publish", channel, message]
		]);
		
		multi.exec((err, replies) => {
			if (err) {
				log.error("Publish transaction failed: " + err);
				return;
			}
			log.info("[" + channel + "] Transaction successful: " + JSON.stringify(replies));
		});


	});

	redisClient.on("error", err => {
		log.error("[PUB] RedisClient Error: " + err);
	});
}

function eventToStorable(event: AppEvent) {
	return {
		event: typeToString(event.event),
		context: contextToString(event.context),
		key: event.key,
		data: event.data
	}
}

function eventToListName(event: AppEvent) {
	var eventContext = contextToString(event.context);
	return eventContext + "/" + event.key;
}

function eventToChannel(event: AppEvent) {
	var eventContext = contextToString(event.context);
	var eventType = typeToString(event.event);

	return [eventContext, eventType, event.key].join("/");
}

function typeToString(eventType: EventType) {
	switch (eventType) {
		case EventType.Create:
			return "create";
		case EventType.Read:
			return "read";
		case EventType.Update:
			return "update";
		case EventType.Delete:
			return "delete";
		case EventType.Notification:
			return "notification";
	}
	throw "InvalidTypeException: Invalid EventType provided";
}

function contextToString(eventContext: EventContext) {
	switch (eventContext) {
		case EventContext.User:
			return "users";
	}
	throw "InvalidContextException: Invalid EventContext provided";
}