const Discord = require('discord.js');
const { Intents, Collection, Permissions } = Discord;
const client = new Discord.Client({
	intents : [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_SCHEDULED_EVENTS,
		Intents.FLAGS.GUILD_MESSAGES,
	],
});
const chalk = require('chalk');
const moment = require('moment');
const EZTwitch = require('@redcrafter07/eztwitch');
const config = require('./config.json');
const twitchClient = new EZTwitch.client()
	.setID(config.id)
	.setSecret(config.secret)
	.setToken(config.twitchToken);

const STREAM_CONFIG = require('./stream.config.js');

let guild;
let channel;
let notifyMsg;
let event;
let live = false;

client.login(config.discordToken);

client.on('ready', async () => {
	console.log(chalk.hex('#5865F2')('[CLIENT]: Ready!'));
	await twitchClient.setup();
	let int = STREAM_CONFIG.twitch.checkInterval;
	await checkForMessage();
	await updateDiscord();
	setInterval(async () => {
		await updateDiscord();
	}, int);
});

async function checkForMessage() {
	guild = await client.guilds.cache.get(STREAM_CONFIG.discord.mainGuild);

	channel = await guild.channels.cache.get(
		STREAM_CONFIG.discord.notificationChannel
	);
	if (!channel.isText()) return;
	await channel.messages.fetch();
	notifyMsg = await channel.messages.cache.find(
		m => m.author.id == client.user.id
	);
	console.log(notifyMsg);
	if (!notifyMsg) {
		await channel.send({
			embeds : [
				new Discord.MessageEmbed()
					.setTitle('Stream Notifications')
					.setDescription(
						'This message is not setuped. The setup process will take about 20 Seconds. It should update itself automatically. :)'
					)
					.setColor(STREAM_CONFIG.colors.offline),
			],
		});
		notifyMsg = channel.messages.cache.find(m => m.author.id == client.user.id);
	}
}

async function updateDiscord() {
	let streamData = await fetchStream(
		STREAM_CONFIG.twitch.channel,
		twitchClient
	);
	let embed = await embedBuilder(streamData);
	// console.log(embed);
	if (notifyMsg) await notifyMsg.edit({ embeds: [ embed ] });
}

async function embedBuilder(streamData) {
	let online = checkStreamOnline(streamData);
	console.log(streamData);
	let embed = new Discord.MessageEmbed();

	if (online) {
		if (!event && STREAM_CONFIG.notifications.useScheduledEvents == true)
			event = await guild.scheduledEvents.create({
				name               : `${STREAM_CONFIG.twitch.channel} is live!`,
				reason             : 'Stream is live.',
				description        : `${STREAM_CONFIG.twitch.channel} is live!`,
				entityType         : 'EXTERNAL',
				scheduledStartTime : moment().add(1, 's').toDate(),
				scheduledEndTime   : moment()
					.add(STREAM_CONFIG.twitch.checkInterval, 'ms')
					.toDate(),
				privacyLevel       : 'GUILD_ONLY',
				entityMetadata     : {
					location : `https://twitch.tv/${STREAM_CONFIG.twitch.channel}`,
				},
			});

		try {
			if (event)
				await event.edit({
					scheduledEndTime : moment()
						.add(STREAM_CONFIG.twitch.checkInterval, 'ms')
						.toDate(),
				});
		} catch (err) {}

		embed.setTitle(`${streamData.title ? streamData.title : 'Untitled'}`);
		embed.setURL(`https://twitch.tv/${streamData.login}`);
		if (streamData.thumbnail && streamData.thumbnail != '')
			embed.setThumbnail(`${streamData.thumbnail}`);
		if (streamData.thumbnail && streamData.thumbnail != '')
			embed.setImage(
				`${EZTwitch.utils.thumbnailSize(
					streamData.thumbnail,
					1920,
					1080
				)}?x=${new Date().getTime()}`
			);
		embed.addFields([
			{ name: 'Viewers', value: `${streamData.viewers}`, inline: true },
			{
				name   : 'Game',
				value  : `${streamData.game ? streamData.game : '-'}`,
				inline : true,
			},
		]);

		embed.setColor;

		embed.footer = `Started at ${EZTwitch.utils.formatTimestamp(
			streamData.startedAt,
			STREAM_CONFIG.twitch.timestampFormat
		)}`;
		embed.setColor(STREAM_CONFIG.colors.online);
		if (live === false && STREAM_CONFIG.notifications.pingRole == true) {
			let msg = await channel.send(
				`<@&${STREAM_CONFIG.discord.notificationRole}>`
			);
			msg.delete();
		}
		live = true;
	} else {
		try {
			if (event) await event.setStatus('COMPLETED');
		} catch (err) {}
		if (event) event = undefined;
		embed
			.setTitle('Offline')
			.setColor(STREAM_CONFIG.colors.offline)
			.setImage(streamData.offlineImage)
			.addFields([
				{
					name   : 'Views',
					value  : `${streamData.views}`,
					inline : false,
				},
				{
					name  : 'Description',
					value : `${streamData.description ? streamData.description : '-'}`,
				},
			]);
		embed.footer = `Created at ${EZTwitch.utils.formatTimestamp(
			streamData.createdAt,
			STREAM_CONFIG.twitch.timestampFormat
		)}`;
		embed.author = {
			name    : `${streamData.display}`,
			iconURL : `${streamData.profileImage}`,
		};
	}

	return embed;
}

function checkStreamOnline(streamData) {
	return streamData.startedAt == undefined ? false : true;
}

async function fetchStream(streamerLogin, client) {
	return await EZTwitch.utils.getStreamInfo(streamerLogin, client);
}
