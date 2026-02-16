const translations = {
    ar: { // Arabic
        name: 'العربية',
        commands: {
            help: { name: 'مساعدة', description: 'عرض جميع الأوامر المتاحة' },
            ban: { name: 'حظر', description: 'حظر مستخدم من الخادم' },
            kick: { name: 'طرد', description: 'طرد مستخدم من الخادم' },
            warn: { name: 'تحذير', description: 'تحذير مستخدم' }
        }
    },
    bg: { // Bulgarian
        name: 'Български',
        commands: {
            help: { name: 'помощ', description: 'Показване на всички налични команди' }
        }
    },
    ku: { // Kurdish
        name: 'کوردی',
        commands: {
            help: { name: 'یارمەتی', description: 'پیشاندانی هەموو فەرمانەکان' }
        }
    },
    cs: { // Czech
        name: 'Čeština',
        commands: {
            help: { name: 'nápověda', description: 'Zobrazit všechny dostupné příkazy' }
        }
    },
    da: { // Danish
        name: 'Dansk',
        commands: {
            help: { name: 'hjælp', description: 'Vis alle tilgængelige kommandoer' }
        }
    },
    de: { // German
        name: 'Deutsch',
        commands: {
            help: { name: 'hilfe', description: 'Alle verfügbaren Befehle anzeigen' }
        }
    },
    el: { // Greek
        name: 'Ελληνικά',
        commands: {
            help: { name: 'βοήθεια', description: 'Εμφάνιση όλων των διαθέσιμων εντολών' }
        }
    },
    en: { // English
        name: 'English',
        commands: {
            help: { name: 'help', description: 'Show all available commands' },
            ban: { name: 'ban', description: 'Ban a user from the server' },
            kick: { name: 'kick', description: 'Kick a user from the server' },
            warn: { name: 'warn', description: 'Warn a user' },
            timeout: { name: 'timeout', description: 'Timeout a user' },
            mute: { name: 'mute', description: 'Mute a user' },
            unmute: { name: 'unmute', description: 'Unmute a user' },
            lock: { name: 'lock', description: 'Lock a channel' },
            unlock: { name: 'unlock', description: 'Unlock a channel' },
            stats: { name: 'stats', description: 'View server statistics' },
            profile: { name: 'profile', description: 'View user profile' },
            leaderboard: { name: 'leaderboard', description: 'View server leaderboard' },
            invite: { name: 'invite', description: 'Get bot invite link' },
            setlang: { name: 'setlang', description: 'Set server language' }
        },
        messages: {
            noPermission: '❌ You don\'t have permission to use this command!',
            userNotFound: '❌ User not found!',
            error: '❌ An error occurred while executing the command.',
            success: '✅ Action completed successfully!',
            banned: '🔨 **{user}** has been banned!\n**Reason:** {reason}\n**Moderator:** {moderator}',
            kicked: '👢 **{user}** has been kicked!\n**Reason:** {reason}\n**Moderator:** {moderator}',
            warned: '⚠️ **{user}** has been warned!\n**Reason:** {reason}\n**Warnings:** {count}',
            muted: '🔇 **{user}** has been muted!\n**Type:** {type}\n**Duration:** {duration}\n**Reason:** {reason}',
            locked: '🔒 Channel locked for {duration}',
            unlocked: '🔓 Channel unlocked'
        }
    },
    es: { // Spanish
        name: 'Español',
        commands: {
            help: { name: 'ayuda', description: 'Mostrar todos los comandos disponibles' }
        }
    },
    fa: { // Persian
        name: 'فارسی',
        commands: {
            help: { name: 'راهنما', description: 'نمایش تمام دستورات موجود' }
        }
    },
    fi: { // Finnish
        name: 'Suomi',
        commands: {
            help: { name: 'apua', description: 'Näytä kaikki käytettävissä olevat komennot' }
        }
    },
    fr: { // French
        name: 'Français',
        commands: {
            help: { name: 'aide', description: 'Afficher toutes les commandes disponibles' }
        }
    },
    he: { // Hebrew
        name: 'עברית',
        commands: {
            help: { name: 'עזרה', description: 'הצג את כל הפקודות הזמינות' }
        }
    },
    hi: { // Hindi
        name: 'हिन्दी',
        commands: {
            help: { name: 'मदद', description: 'सभी उपलब्ध आदेश दिखाएं' }
        }
    },
    hr: { // Croatian
        name: 'Hrvatski',
        commands: {
            help: { name: 'pomoć', description: 'Prikaži sve dostupne naredbe' }
        }
    },
    hu: { // Hungarian
        name: 'Magyar',
        commands: {
            help: { name: 'segítség', description: 'Az összes elérhető parancs megjelenítése' }
        }
    },
    it: { // Italian
        name: 'Italiano',
        commands: {
            help: { name: 'aiuto', description: 'Mostra tutti i comandi disponibili' },
            ban: { name: 'banna', description: 'Banna un utente dal server' },
            kick: { name: 'espelli', description: 'Espelli un utente dal server' },
            warn: { name: 'avverti', description: 'Avverti un utente' },
            timeout: { name: 'timeout', description: 'Metti un utente in timeout' },
            mute: { name: 'silenzia', description: 'Silenzia un utente' },
            unmute: { name: 'riattiva', description: 'Riattiva un utente' },
            lock: { name: 'blocca', description: 'Blocca un canale' },
            unlock: { name: 'sblocca', description: 'Sblocca un canale' },
            stats: { name: 'statistiche', description: 'Visualizza le statistiche del server' },
            profile: { name: 'profilo', description: 'Visualizza il profilo utente' },
            leaderboard: { name: 'classifica', description: 'Visualizza la classifica del server' },
            invite: { name: 'invita', description: 'Ottieni il link di invito del bot' },
            setlang: { name: 'lingua', description: 'Imposta la lingua del server' }
        },
        messages: {
            noPermission: '❌ Non hai il permesso di usare questo comando!',
            userNotFound: '❌ Utente non trovato!',
            error: '❌ Si è verificato un errore durante l\'esecuzione del comando.',
            success: '✅ Azione completata con successo!',
            banned: '🔨 **{user}** è stato bannato!\n**Motivo:** {reason}\n**Moderatore:** {moderator}',
            kicked: '👢 **{user}** è stato espulso!\n**Motivo:** {reason}\n**Moderatore:** {moderator}',
            warned: '⚠️ **{user}** è stato avvertito!\n**Motivo:** {reason}\n**Avvertimenti:** {count}',
            muted: '🔇 **{user}** è stato silenziato!\n**Tipo:** {type}\n**Durata:** {duration}\n**Motivo:** {reason}',
            locked: '🔒 Canale bloccato per {duration}',
            unlocked: '🔓 Canale sbloccato'
        }
    },
    ja: { // Japanese
        name: '日本語',
        commands: {
            help: { name: 'ヘルプ', description: '利用可能なすべてのコマンドを表示' }
        }
    },
    ko: { // Korean
        name: '한국어',
        commands: {
            help: { name: '도움말', description: '사용 가능한 모든 명령어 표시' }
        }
    },
    lt: { // Lithuanian
        name: 'Lietuvių',
        commands: {
            help: { name: 'pagalba', description: 'Rodyti visas galimas komandas' }
        }
    },
    nl: { // Dutch
        name: 'Nederlands',
        commands: {
            help: { name: 'help', description: 'Toon alle beschikbare commando\'s' }
        }
    },
    no: { // Norwegian
        name: 'Norsk',
        commands: {
            help: { name: 'hjelp', description: 'Vis alle tilgjengelige kommandoer' }
        }
    },
    pl: { // Polish
        name: 'Polski',
        commands: {
            help: { name: 'pomoc', description: 'Pokaż wszystkie dostępne polecenia' }
        }
    },
    pt: { // Portuguese
        name: 'Português',
        commands: {
            help: { name: 'ajuda', description: 'Mostrar todos os comandos disponíveis' }
        }
    },
    'pt-BR': { // Portuguese (Brazilian)
        name: 'Português (Brasil)',
        commands: {
            help: { name: 'ajuda', description: 'Mostrar todos os comandos disponíveis' }
        }
    },
    ro: { // Romanian
        name: 'Română',
        commands: {
            help: { name: 'ajutor', description: 'Afișează toate comenzile disponibile' }
        }
    },
    ru: { // Russian
        name: 'Русский',
        commands: {
            help: { name: 'помощь', description: 'Показать все доступные команды' }
        }
    },
    sk: { // Slovak
        name: 'Slovenčina',
        commands: {
            help: { name: 'pomoc', description: 'Zobraziť všetky dostupné príkazy' }
        }
    },
    sr: { // Serbian
        name: 'Српски',
        commands: {
            help: { name: 'помоћ', description: 'Прикажи све доступне команде' }
        }
    },
    sv: { // Swedish
        name: 'Svenska',
        commands: {
            help: { name: 'hjälp', description: 'Visa alla tillgängliga kommandon' }
        }
    },
    th: { // Thai
        name: 'ไทย',
        commands: {
            help: { name: 'ช่วยเหลือ', description: 'แสดงคำสั่งที่ใช้งานได้ทั้งหมด' }
        }
    },
    tl: { // Tagalog
        name: 'Tagalog',
        commands: {
            help: { name: 'tulong', description: 'Ipakita ang lahat ng available na commands' }
        }
    },
    tr: { // Turkish
        name: 'Türkçe',
        commands: {
            help: { name: 'yardım', description: 'Tüm kullanılabilir komutları göster' }
        }
    },
    uk: { // Ukrainian
        name: 'Українська',
        commands: {
            help: { name: 'допомога', description: 'Показати всі доступні команди' }
        }
    },
    vi: { // Vietnamese
        name: 'Tiếng Việt',
        commands: {
            help: { name: 'trợgiúp', description: 'Hiển thị tất cả các lệnh có sẵn' }
        }
    },
    'zh-CN': { // Chinese Simplified
        name: '简体中文',
        commands: {
            help: { name: '帮助', description: '显示所有可用命令' }
        }
    },
    'zh-TW': { // Chinese Traditional
        name: '繁體中文',
        commands: {
            help: { name: '幫助', description: '顯示所有可用命令' }
        }
    }
};

module.exports = { translations };
