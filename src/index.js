const { Client } = require('discord.js');
const { CommandKit } = require('commandkit');
const mongoose = require('mongoose');
require('dotenv/config');

const client = new Client({
    intents: ['Guilds', 'GuildMembers', 'GuildMessages', 'MessageContent'],
});

new CommandKit({
    client,
    commandsPath: `${__dirname}/commands`,
    eventsPath: `${__dirname}/events`,
    devGuildIds: ['365238301365501952'],
    devUserIds: ['293102919270531072'],
    bulkRegister: true,
});

mongoose.connect(process.env.MONGODB_URI).then(() => {
    console.log('✅ Connecté à la Database.');

    client.login(process.env.TOKEN);
});
