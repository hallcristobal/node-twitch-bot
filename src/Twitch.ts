import * as net from 'net';

const CONNECTION_CONFIRM: string = ":tmi.twitch.tv 372 <user> :You are in a maze of twisty passages.";

interface ChatCommand {
	id: string;
	args: string[];
}
export class TwitchConnection {
	private client: net.Socket;
	private connected: boolean;
	private username: string;
	private channel: string;
	private membership: Boolean;
	private tags: Boolean;
	private commands: Boolean;

	constructor(username: string, oauth: string, channel: string) {
		this.connected = false;
		this.membership = false;
		this.tags = false;
		this.commands = false;
		this.username = username;
		this.channel = channel;

		this.client = net.createConnection(6667, "irc.twitch.tv");
		this.client.setEncoding("utf8");
		this.client.addListener("connect", () => {
			this.client.write("PASS " + oauth + "\r\n");
			this.client.write("NICK " + username + "\r\n");
			this.client.write("JOIN #" + channel + "\r\n");
			this.client.write("CAP REQ :twitch.tv/membership\r\n");
			this.client.write("CAP REQ :twitch.tv/tags\r\n");
			this.client.write("CAP REQ :twitch.tv/commands\r\n");
		});

		this.client.addListener("data", (buffer) => { this.onData(buffer); });
		this.client.addListener("close", (err) => { this.onClose(err); });
	}

	onData(buffer: Buffer) {
		let raw = buffer.toString().trim();
		let splits = raw.split("\n");
		splits.forEach((s) => {
			switch (s) {
				case CONNECTION_CONFIRM: {
					this.connected = true;
					break;
				}
				case "PING :tmi.twitch.tv": {
					this.client.write("PONG :tmi.twitch.tv\r\n");
					break;
				}
				case ":tmi.twitch.tv CAP * ACK :twitch.tv/membership": {
					this.membership = true;
					break;
				}
				case ":tmi.twitch.tv CAP * ACK :twitch.tv/tags": {
					this.tags = true;
					break;
				}
				case ":tmi.twitch.tv CAP * ACK :twitch.tv/commands": {
					this.commands = true;
					break;
				}
				default: {
					if (s.indexOf("FUCKK") >= 0) {
						this.sendMessage("PRIVMSG", "oh");
					} else if (s.indexOf("LOG") >= 0) {
						console.log(this);
					}
				}
			}
			console.log(s);
		});
	}

	sendIrcMessage(message: string) {
		this.client.write(message);
	}

	sendMessage(type: string, message: string) {
		this.sendIrcMessage(`:${this.username}!${this.username}@${this.username}.tmi.twitch.tv ${type} ${this.channel} :${message}\r\n`);
	}

	onClose(err: boolean) {
		console.log("con closed: " + err);
		this.connected = false;
	}

	chatCommand(input: string, symbol: string = "!"): ChatCommand | null {
		let match = input.match(/^\!(\S*) (.*)$/);
		return !match ? null : {
			id: match[1],
			args: match[2].split(/\s/)
		};
	};
}
