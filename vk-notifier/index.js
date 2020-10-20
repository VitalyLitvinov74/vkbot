const VkBot = require('node-vk-bot-api')
//Серийный финансист. https://vk.com/fin_white
const group_id = 85975456;
const bot = new VkBot({
    token: 'bb9ebaede1c3498d0ae5c8d143226bfd9d0acbe3bd49b69c87b0a0bf3b18f6a2c70ce3227e4f53cbe8d4e',
    execute_timeout: 5000
});

const messages = [
    `Вмоейкоманде,котораяпредоставляетбесплатныесигналы(сделкикоторыеязаключаюидублируювам),ещеестьнесколькосвободныхмест.Япокачтомогупринятьновичков,которыебудутразвиватьсявместесомной.Приэтом,дляменянеимеетзначениякакойутебяуровеньзнаний.ИэтовсеБЕСПЛАТНОПочемубесплатно?Дапотомучтолегчеполучать%зато,чтопомогаешьчеловеку,чембратьснегоденьги,когдаондаженезнает,зачтобудетплатить...CостатистикоймоихсигналовтыможешьознакомитьсявбесплатномTelegramканале🔥https://teledur.ru/joinchat/AAAAAFFOpbWsMxhfXoPG9gТеперьответьнавопрос,тыжелаешькомневзакрытуюгруппу?`,
    `То,чтоувасестьопыт,этобольшойплюсТаккакувасестьпониманиеиопыт,вамбудетнамногопрощеставитьпомоимсигналамУсловияпопаданиявзакрытуюгруппумаксимальнопросты:1.ВамнужнобудетпройтирегистрациюпомоейссылкенаBINARIUM2.Этонужнодлятого,чтобыяполучал2.5%отторговогооборотаCостатистикоймоихсигналовтыможешьознакомитьсявбесплатномTelegramканале🔥-https://teledur.ru/joinchat/AAAAAFFOpbWsMxhfXoPG9gАтеперьяждуотвасответаЕслиготовы,тонапишите«да»Еслинет,тотакискажите«нет»Потомучтообщениесвамиведётживойчеловек😌`,
    `Давайтеначнемсрегистрацииуброкера,гдебудемторговать.РегистрируйтесьуброкераBinariumпоссылкениже.https://vk.cc/aes1apПослерегистрациипришлитемнесюдасвойID.Выегонайдетевразделе"Профиль".Этонужно,чтобыямогпроверитьвашпорядковыйномеррегистрации.Пример:«id1337790»Какпройдётерегистрацию,напишитесюда.`,
    `Отлично,осталсяфинальныйшагПополняйтесвойсчётналюбуюсумму(Можешьдаженаобычныйминимумброкера!)итывмоейкоманде,гдебудешьполучатьсигналыспроходимостьюот80%Незабудьнаписатьсюда,какпополнишьсвойсчётинетянисэтим,ведьзаработатьтыможешьужесегодня!`
];

const notif = [
    `, ну как ознакомились с моей статистикой ? Работать будем?`,
    `, ну как ознакомились с моей статистикой ? Работать будем?`,
    `, когда сможете пройти регистрацию?`,
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
