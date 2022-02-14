module.exports = {
	twitch        : {
		channel         : 'redcrafter07_live', //the twitch streamer login
		checkInterval   : 10 * 1000, //the interval to check weather the streamer is online or not and update the embeds. 10 Seconds are recommended.
		timestampFormat : 'DD.MM.YYYY HH:mm:ss', //the format of the timestamp in the footer
	},
	discord       : {
		mainGuild           : '708309819626487928', //the discord guild id you want to be notified
		notificationChannel : '931899440166486096', //the channel of the guild where to notify
		notificationRole    : '931900423894364190', //the role to ping when notified
	},
	notifications : {
		pingRole           : true, //if true the role will be pinged when notified
		useScheduledEvents : true, // if true, the bot will create a guild scheduled event for the stream :)
	},
	colors        : {
		offline : '#ffcc00', //the color of the embed when the streamer is offline
		online  : '#ff3434', //the color of the embed when the streamer is online
	},
};
