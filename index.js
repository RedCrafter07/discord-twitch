const Discord = require('discord.js');
const { Intents, Collection, Permissions } = Discord;
const client = new Discord.Client({
	intents: [ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_SCHEDULED_EVENTS, Intents.FLAGS.GUILD_MESSAGES ]
});
const chalk = require('chalk');
const EZTwitch = require('@redcrafter07/eztwitch');
const config = require('./config.json');
const twitchClient = new EZTwitch.client().setID(config.id).setSecret(config.secret);

client.login(config.discordToken);

client.on('ready', async () => {
	console.log(chalk.green('[CLIENT]: Ready!'));
	await twitchClient.setup();
	console.log(await fetchStream('monstercat', twitchClient));
});

async function fetchStream(streamerLogin, client) {
	return await EZTwitch.utils.getStreamInfo(streamerLogin, client);
}
