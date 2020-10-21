const VkBot = require('node-vk-bot-api')
//Трейдинг с умом. https://vk.com/tradingsymom
const group_id = 190351055;
const bot = new VkBot({
    token: 'dd9c1066b305289df0ac759f4c4374fe11b10d3b0c206203b117ed1b448d867d5a70a7ab200cfdab486d8',
    execute_timeout: 5000
});

const messages = [
    `Ничегострашного,чтоуваснетопыта,потомучто80%участниковзакрытойгруппытакиежеиимэтонемешает!Внашейкоманде,котораяпредоставляетбесплатныесигналы(сделкикоторыеязаключаюидублируювам),ещеестьнесколькосвободныхмест.Перейдяпоссылке,выпоймётето,чемязанимаюсьчтобыбытьвкурсепроисходящего:https://vk.com/topic-190351055_40896137СигналыядаюБЕСПЛАТНОПочемубесплатно?Дапотомучтолегчеполучать%зато,чтопомогаешьчеловеку,чембратьснегоденьги,когдаондаженезнает,зачтобудетплатить...Теперьдайтеответ,желаетеливыкомневкоманду?`,
    `То,чтоувасестьопыт,этобольшойплюсТаккакувасестьпониманиеиопыт,вамбудетнамногопрощеставитьпомоимсигналамУсловияпопаданиявзакрытуюгруппумаксимальнопросты:1.ВамнужнобудетпройтирегистрациюпомоейссылкенаBINARIUM2.Этонужнодлятого,чтобыяполучал5%оттого,чтовывожувасвплюсЕслинетдовериякомне,можетеознакомитьсясостатистикоймоейкоманды-https://vk.com/club173988367-https://vk.com/club173988367АтеперьяждуотвасответаЕслиготовы,тонапишите«да»Еслинет,тотакискажите«нет»Потомучтообщениесвамиведётживойчеловек😌`,
    `ПравильныйвыборДавайтеначнемсрегистрациинаплатформе,гдемыбудемторговать.Проверенныйброкер,накоторомяработаюужеболеегода.https://vk.cc/9cPCtUПослерегистрациипришлитесюдасвойID.Выегонайдетевразделе"Профиль".Этонужно,чтобыпроверитьпорядковыйномеррегистрации.Пример:«id1337790»Какпройдётерегистрацию,напишитесюда.`,
    `Отлично,теперьвамосталосьпополнитьсвойсчётивасдобавятвзакрытуюгруппуивзакрытыйтелеграммканал!Суммупополнениявывыбираетесами.(Минимальноепополнениесчетасоставляет5$или300рублейРоссии)Послепополнениянезабудьтенаписатьсюда,этоважно!https://vk.com/club173988367статистикамоейторговли!https://m.vk.com/topic-190351055_40770840отзывыобомне!`
];

const notif = [
    `, что скажете? Работать будем?`,
    `, что скажете? Работать будем?`,
    `, когда сможете зарегистрироваться?`,
    `, когда сможете пополнить счёт?`,
]

let pendings = {};

let users = {};

function deletePending(user_id) {
    clearInterval(pendings[user_id]);
    return delete pendings[user_id];
}

function deleteUserNotif(user_id) {
    clearTimeout(users[user_id]);
    return delete users[user_id];
}

async function newPending(msg_id, user_id, messageIndex) {
    const user = await bot.execute('users.get', {
        user_id: user_id,
    });
    pendings[user_id] = setInterval(async () => {
        const msg = await bot.execute('messages.getById', {
            message_ids: msg_id
        });
        if (!msg.items) {
            console.log(msg);
            return deletePending(user_id);
        }
        if (msg.items[0].read_state === 1) {
            users[user_id] = setTimeout(async () => {
                const msgAllowed = await bot.execute('messages.isMessagesFromGroupAllowed', {
                    group_id: Number(group_id),
                    user_id: Number(user_id)
                });
                if (msgAllowed.is_allowed === 0) {
                    deleteUserNotif(user_id);
                    return deletePending(user_id);
                }
                try {
                    bot.sendMessage(user_id, `${user[0].first_name}${notif[messageIndex]}`);
                } catch (err) {
                    console.log(err);
                }
                deleteUserNotif(user_id);
                return deletePending(user_id);
            }, 60000 * 90); //60000 * 90
        }
    }, 60000 * 2) //60000
}

bot.event('message_reply', async ctx => {
    //return console.log(String(ctx.message.body).split("\n").join("").split(" ").join(""));
    if (pendings[ctx.message.user_id]) return;
    if (users[ctx.message.user_id]) return;
    for (let i = 0; i < messages.length; i++) {
        if (messages[i] === String(ctx.message.body).split("\n").join("").split(" ").join("")) {
            return newPending(ctx.message.id, ctx.message.user_id, i);
        }
    }
});

bot.event('message_new', ctx => {
    if (pendings[ctx.message.user_id]) {
        return deletePending(ctx.message.user_id);
    }
    if (users[ctx.message.user_id]) {
        return deleteUserNotif(ctx.message.user_id);
    }
    return;
})

bot.startPolling();
