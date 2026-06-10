const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType, PermissionFlagsBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// ⚙️ الإعدادات - عدّلها حسب سيرفرك
const CONFIG = {
    TOKEN: process.env.TOKEN,
    APPS_CHANNEL_ID: process.env.APPS_CHANNEL_ID,
    LOG_CHANNEL_ID: process.env.LOG_CHANNEL_ID,
    ADMIN_ROLE_ID: process.env.ADMIN_ROLE_ID,
    SERVER_NAME: process.env.SERVER_NAME || 'ROMA',
};

// أنواع التقديم
const APPLICATION_TYPES = {
    'moderator': {
        label: '🛡️ مشرف',
        description: 'التقديم لوظيفة مشرف',
        color: 0x5865F2,
        questions: [
            { id: 'name', label: 'الاسم الكامل', placeholder: 'اكتب اسمك هنا...', style: TextInputStyle.Short },
            { id: 'age', label: 'العمر', placeholder: 'كم عمرك؟', style: TextInputStyle.Short },
            { id: 'experience', label: 'الخبرة السابقة', placeholder: 'هل سبق لك العمل كمشرف؟ اشرح...', style: TextInputStyle.Paragraph },
            { id: 'reason', label: 'لماذا تريد الانضمام للإدارة؟', placeholder: 'اكتب سبب تقديمك...', style: TextInputStyle.Paragraph },
            { id: 'hours', label: 'كم ساعة يمكنك التواجد يومياً؟', placeholder: 'مثال: 4 ساعات', style: TextInputStyle.Short },
        ]
    },
    'admin': {
        label: '⚙️ إداري',
        description: 'التقديم لوظيفة إداري',
        color: 0xED4245,
        questions: [
            { id: 'name', label: 'الاسم الكامل', placeholder: 'اكتب اسمك هنا...', style: TextInputStyle.Short },
            { id: 'age', label: 'العمر', placeholder: 'كم عمرك؟', style: TextInputStyle.Short },
            { id: 'skills', label: 'مهاراتك الإدارية', placeholder: 'ما هي مهاراتك في الإدارة؟', style: TextInputStyle.Paragraph },
            { id: 'reason', label: 'لماذا تستحق هذا المنصب؟', placeholder: 'اكتب مبرراتك...', style: TextInputStyle.Paragraph },
            { id: 'discord_xp', label: 'خبرتك في إدارة السيرفرات', placeholder: 'كم سيرفر أدرت من قبل؟', style: TextInputStyle.Short },
        ]
    },
    'helper': {
        label: '🤝 مساعد',
        description: 'التقديم لوظيفة مساعد',
        color: 0x57F287,
        questions: [
            { id: 'name', label: 'الاسم الكامل', placeholder: 'اكتب اسمك هنا...', style: TextInputStyle.Short },
            { id: 'age', label: 'العمر', placeholder: 'كم عمرك؟', style: TextInputStyle.Short },
            { id: 'how_help', label: 'كيف يمكنك مساعدة الأعضاء؟', placeholder: 'اشرح كيف ستساعد...', style: TextInputStyle.Paragraph },
            { id: 'availability', label: 'أوقات تواجدك', placeholder: 'متى تكون متاحاً؟', style: TextInputStyle.Short },
        ]
    }
};

// ========================
// إرسال البانل
// ========================
async function sendApplicationPanel(channel) {
    const embed = new EmbedBuilder()
        .setTitle(`اهلا بك في تقديم الاداره`)
        .setDescription(`قم بالضغط على الزر بالأسفل لفتح تذكرة تقديم 📌`)
        .setColor(0x2B2D31)
        .setThumbnail('https://i.imgur.com/AfFp7pu.png')
        .setImage('https://i.imgur.com/4M34hi2.png') // يمكنك تغييره ببانر سيرفرك
        .setFooter({ text: `${CONFIG.SERVER_NAME} • نظام التقديم` });

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('select_application_type')
        .setPlaceholder('اختر نوع التقديم')
        .addOptions([
            {
                label: '🛡️ مشرف',
                description: 'التقديم لوظيفة مشرف',
                value: 'moderator',
                emoji: '🛡️'
            },
            {
                label: '⚙️ إداري',
                description: 'التقديم لوظيفة إداري',
                value: 'admin',
                emoji: '⚙️'
            },
            {
                label: '🤝 مساعد',
                description: 'التقديم لوظيفة مساعد',
                value: 'helper',
                emoji: '🤝'
            }
        ]);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await channel.send({ embeds: [embed], components: [row] });
}

// ========================
// معالجة القائمة المنسدلة
// ========================
client.on('interactionCreate', async (interaction) => {

    // اختيار نوع التقديم
    if (interaction.isStringSelectMenu() && interaction.customId === 'select_application_type') {
        const type = interaction.values[0];
        const appType = APPLICATION_TYPES[type];

        // بناء الـ Modal
        const modal = new ModalBuilder()
            .setCustomId(`app_modal_${type}`)
            .setTitle(`تقديم - ${appType.label}`);

        const questions = appType.questions.slice(0, 5); // Discord يدعم 5 فقط
        const components = questions.map(q => {
            const input = new TextInputBuilder()
                .setCustomId(q.id)
                .setLabel(q.label)
                .setPlaceholder(q.placeholder)
                .setStyle(q.style)
                .setRequired(true);
            if (q.style === TextInputStyle.Paragraph) input.setMaxLength(1000);
            return new ActionRowBuilder().addComponents(input);
        });

        modal.addComponents(...components);
        await interaction.showModal(modal);
    }

    // استقبال الـ Modal
    if (interaction.isModalSubmit() && interaction.customId.startsWith('app_modal_')) {
        await interaction.deferReply({ ephemeral: true });

        const type = interaction.customId.replace('app_modal_', '');
        const appType = APPLICATION_TYPES[type];

        // بناء الـ Embed للطلب
        const appEmbed = new EmbedBuilder()
            .setTitle(`📋 طلب تقديم جديد - ${appType.label}`)
            .setColor(appType.color)
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '👤 المتقدم', value: `${interaction.user} (${interaction.user.tag})`, inline: true },
                { name: '🆔 الـ ID', value: interaction.user.id, inline: true },
                { name: '📅 التاريخ', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
            )
            .setFooter({ text: `${CONFIG.SERVER_NAME} • نظام التقديم` })
            .setTimestamp();

        // إضافة إجابات الأسئلة
        appType.questions.forEach(q => {
            try {
                const answer = interaction.fields.getTextInputValue(q.id);
                appEmbed.addFields({ name: q.label, value: answer || 'لم يتم الإجابة', inline: false });
            } catch (e) {}
        });

        // أزرار القبول والرفض
        const actionRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`accept_app_${interaction.user.id}_${type}`)
                .setLabel('✅ قبول')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`reject_app_${interaction.user.id}_${type}`)
                .setLabel('❌ رفض')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId(`pending_app_${interaction.user.id}_${type}`)
                .setLabel('⏳ قيد المراجعة')
                .setStyle(ButtonStyle.Secondary)
        );

        // إرسال الطلب لقناة الطلبات
        const appsChannel = interaction.guild.channels.cache.get(CONFIG.APPS_CHANNEL_ID);
        if (appsChannel) {
            await appsChannel.send({ embeds: [appEmbed], components: [actionRow] });
        }

        await interaction.editReply({
            content: '✅ **تم إرسال طلبك بنجاح!**\nسيتم مراجعة طلبك من قِبَل الإدارة وسيتم إبلاغك بالنتيجة قريباً.',
        });
    }

    // أزرار القبول/الرفض
    if (interaction.isButton()) {
        const [action, , targetId, type] = interaction.customId.split('_');
        if (!['accept', 'reject', 'pending'].includes(action)) return;

        // التحقق من صلاحيات الإدارة
        const hasPermission = interaction.member.roles.cache.has(CONFIG.ADMIN_ROLE_ID) || 
                              interaction.member.permissions.has(PermissionFlagsBits.Administrator);

        if (!hasPermission) {
            return interaction.reply({ content: '❌ ليس لديك صلاحية للقيام بهذا الإجراء.', ephemeral: true });
        }

        await interaction.deferUpdate();

        const targetUser = await client.users.fetch(targetId).catch(() => null);
        const appType = APPLICATION_TYPES[type];

        const messages = {
            accept: { color: 0x57F287, text: '✅ تم قبول الطلب', dm: `🎉 **مبروك!** تم قبول طلب تقديمك كـ ${appType?.label} في سيرفر **${CONFIG.SERVER_NAME}**!` },
            reject: { color: 0xED4245, text: '❌ تم رفض الطلب', dm: `😔 نأسف لإبلاغك أنه تم **رفض** طلب تقديمك كـ ${appType?.label} في سيرفر **${CONFIG.SERVER_NAME}**.` },
            pending: { color: 0xFEE75C, text: '⏳ قيد المراجعة', dm: `📝 طلب تقديمك كـ ${appType?.label} في سيرفر **${CONFIG.SERVER_NAME}** لا يزال **قيد المراجعة**.` }
        };

        const msg = messages[action];

        // تعديل الـ Embed
        const oldEmbed = interaction.message.embeds[0];
        const updatedEmbed = EmbedBuilder.from(oldEmbed)
            .setColor(msg.color)
            .addFields({ name: '📊 الحالة', value: `${msg.text} بواسطة ${interaction.user}`, inline: false });

        // تعطيل الأزرار
        const disabledRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('accept_done').setLabel('✅ قبول').setStyle(ButtonStyle.Success).setDisabled(true),
            new ButtonBuilder().setCustomId('reject_done').setLabel('❌ رفض').setStyle(ButtonStyle.Danger).setDisabled(true),
            new ButtonBuilder().setCustomId('pending_done').setLabel('⏳ قيد المراجعة').setStyle(ButtonStyle.Secondary).setDisabled(true)
        );

        await interaction.message.edit({ embeds: [updatedEmbed], components: [disabledRow] });

        // إرسال DM للمتقدم
        if (targetUser) {
            const dmEmbed = new EmbedBuilder()
                .setTitle(`نتيجة طلبك في ${CONFIG.SERVER_NAME}`)
                .setDescription(msg.dm)
                .setColor(msg.color)
                .setTimestamp();
            await targetUser.send({ embeds: [dmEmbed] }).catch(() => {});
        }
    }
});

// ========================
// أمر إرسال البانل
// ========================
client.on('messageCreate', async (message) => {
    if (message.content === '!panel' && message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
        await sendApplicationPanel(message.channel);
        await message.delete().catch(() => {});
    }
});

client.once('ready', () => {
    console.log(`✅ البوت شغال: ${client.user.tag}`);
    client.user.setActivity('تقديمات الإدارة | ROMA', { type: 3 });
});

client.login(CONFIG.TOKEN);
