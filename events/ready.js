const { ActivityType } = require('discord.js');

module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log('\n╔════════════════════════════════════════╗');
        console.log(`║  ✅ Bot online: ${client.user.tag.padEnd(22)} ║`);
        console.log(`║  🎵 Server attivi: ${client.guilds.cache.size.toString().padEnd(19)} ║`);
        console.log(`║  👤 Utenti totali: ${client.users.cache.size.toString().padEnd(19)} ║`);
        console.log('╚════════════════════════════════════════╝\n');
        
        client.user.setPresence({
            activities: [{ 
                name: '🎵 /play per iniziare!', 
                type: ActivityType.Listening 
            }],
            status: 'online'
        });

        console.log('🎵 Bot pronto per riprodurre musica!\n');
    }
};
