import * as fs from 'fs';
import { TwitchConnection } from './Twitch';

interface Options {
	oauth: string,
	username: string,
	channel: string
}

function run() {
	let o: Options = null;
	try {
		let _opt = fs.readFileSync("config.json");
		o = JSON.parse(_opt.toString());
	} catch (e) {
		console.error("Failed to parse config file: " + e);
	}
	if (o != null) {
		let twitch = new TwitchConnection(o.username, o.oauth, o.channel);
	}
}

run();
