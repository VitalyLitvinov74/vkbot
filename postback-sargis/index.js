require("dotenv").config();
require("./db");
const express = require("express");
const app = express();
const port = 3000;
const token = "1213033561:AAGbTZzAntmperU973iRppaYIs98BFu9bhI";
const Admin = require("./models/Admin");
const Lead = require("./models/Lead");

const { Telegraf } = require("telegraf");
const session = require("telegraf/session");
const Extra = require("telegraf/extra");
const Markup = require("telegraf/markup");

const bot = new Telegraf(token);
bot.use(session());
bot.start(async (ctx) => {
  await Admin.findOne({ userID: ctx.from.id }, (err, admin) => {
    if (!admin) {
      try {
        return ctx.reply(
          "У вас недостаточно прав для просмотра уведомлений.\n\nЯ напишу Вам, как только мой владелец добавит Вас в список администраторов ;)"
        );
      } catch (err) {
        console.log(err);
      }
    }

    try {
      if (admin.owner === false) {
        return ctx.reply(
          "Всё в норме. Вы являетесь администратором!\nБуду уведомлять Вас по всем событиям ПП.\n\nЕсли хотите проверить определенный UID - просто пришлите мне его."
        );
      }
      if (admin.owner === true) {
        return ctx.reply(
          "Всё в норме. Вы являетесь владельцом!\n\nБуду уведомлять Вас по всем событиям ПП.\n\nЕсли хотите проверить определенный UID - просто пришлите мне его.",
          Markup.keyboard([
            ["Cписок администраторов"],
            ["Добавить администратора"],
          ])
            .resize()
            .extra()
        );
      }
    } catch (err) {
      console.log(err);
    }
  });
});

bot.hears("Cписок администраторов", async (ctx) => {
    await Admin.findOne({ userID: ctx.from.id }, async (err, admin) => {
      if (!admin) {
        return ctx.reply("Недостаточно прав.");
      }
      if (admin.owner === true) {
          const admins = await Admin.find({ owner: false });
          if (admins.length === 0) {
            try {
              ctx.reply("Администраторов не найдено.");
            } catch (err) {}
          } else {
            for (let i = 0; i < admins.length; i++) {
              try {
                ctx.reply(
                  `Имя: ${admins[i].name}\nID в тг: ${admins[i].userID}`,
                  Markup.inlineKeyboard([
                    Markup.callbackButton("Удалить", `delete ${admins[i].userID}`),
                  ]).extra()
                );
              } catch (err) {}
            }
          }
      }
      if (admins.owner === false) {
          return ctx.reply("Недостаточно прав.");
      }
    });
  });

  bot.hears("Добавить администратора", async (ctx) => {
    await Admin.findOne({ userID: ctx.from.id }, (err, admin) => {
        if (!admin) {
          return ctx.reply("Недостаточно прав.");
        }
        if (admin.owner === true) {
            ctx.session.addUser = { step: "id" };
            try {
              ctx.reply(
                "Напишите ID пользователя в телеграмме.\n\nУзнать ID он может с помощью @userinfobot",
                Markup.inlineKeyboard([
                  Markup.callbackButton("Отмена", "cancel adding"),
                ]).extra()
              );
            } catch (err) {}
        }
        if (admin.owner === false) {
            return ctx.reply("Недостаточно прав.");
        }
      });
});

bot.hears(/^ф(дт|тд|д)$/i, async (ctx) => {
  const admin = await Admin.findOne({ userID: ctx.from.id });
  if (!admin) return ctx.reply("Вы не являетесь администратором.");
  Lead.count(
    {
      date: {
        $gte: new Date().setHours(0, 0, 0, 0),
        $lt: new Date().setHours(23, 59, 59, 59),
      },
      ftd: "true",
      sumdep: { $ne: "0" },
    },
    (err, count) => {
      if (err) console.log(err);
      try {
        ctx.reply(
          `FTD за сегодня: ${count}\n${new Date().getDate()}.${
            new Date().getMonth() + 1
          }.${new Date().getFullYear()}`
        );
      } catch (err) {
        console.log(err);
      }
    }
  );
});

bot.hears(/^ре(г|ги|га)$/i, async (ctx) => {
  const admin = await Admin.findOne({ userID: ctx.from.id });
  if (!admin) return ctx.reply("Вы не являетесь администратором.");
  Lead.count(
    {
      date: {
        $gte: new Date().setHours(0, 0, 0, 0),
        $lt: new Date().setHours(23, 59, 59, 59),
      },
      ftd: "false",
    },
    (err, count) => {
      if (err) console.log(err);
      try {
        ctx.reply(
          `Регистраций за сегодня: ${count}\n(без ftd)\n${new Date().getDate()}.${
            new Date().getMonth() + 1
          }.${new Date().getFullYear()}`
        );
      } catch (err) {
        console.log(err);
      }
    }
  );
});

bot.on("callback_query", async (ctx) => {
  const data = ctx.update.callback_query.data.split(" ");
  if (data[0] === "delete") {
    await Admin.deleteOne({ userID: data[1] });
    await ctx.reply(
      `Пользователь успешно удалён\nи больше не имеет доступа к боту.`
    );
    ctx.answerCbQuery();
    try {
      bot.telegram.sendMessage(
        data[1],
        `Вы были удалены из списка администраторов!\n\nС этого момента Вы не сможете пользоваться моим функционалом.`
      );
    } catch (err) {}
  }
  if (data[0] === "cancel") {
    delete ctx.session.addUser;
    ctx.answerCbQuery();
    return ctx.reply("Отменено.");
  }
});

bot.on("text", async (ctx) => {
  if (ctx.session.addUser) {
    if (ctx.session.addUser.step === "id") {
      const id = Number.parseInt(ctx.message.text);
      if (typeof id !== "number") {
        delete ctx.session.addUser;
        return ctx.reply("Неверный ID. Попробуйте ещё раз");
      }
      const admin = await Admin.findOne({ userID: id });
      if (admin) {
        ctx.reply("Администратор с таким айди уже добавлен.");
        return delete ctx.session.addUser;
      }
      ctx.session.addUser["id"] = id;
      ctx.session.addUser.step = "name";
      return ctx.reply(
        "Теперь введите имя администратора:",
        Markup.inlineKeyboard([
          Markup.callbackButton("Отмена", "cancel adding"),
        ]).extra()
      );
    }
    if (ctx.session.addUser.step === "name") {
      ctx.session.addUser["name"] = ctx.message.text;
      await new Admin({
        userID: ctx.session.addUser.id,
        name: ctx.session.addUser.name,
        owner: false,
      }).save();
      try {
        bot.telegram.sendMessage(
          ctx.session.addUser.id,
          "Вас добавили в список администраторов!\nТеперь Вы можете пользоваться ботом."
        );
      } catch (err) {}
      ctx.reply(
        `Администратор добавлен!\n\nID: ${ctx.session.addUser.id}\nИмя: ${ctx.session.addUser.name}`
      );
      return delete ctx.session.addUser;
    }
  }
  const text = ctx.message.text;
  const id = text.match(/[0-9]{5,20}/);
  if (id !== null) {
    const admin = await Admin.findOne({ userID: ctx.from.id });
    if (!admin) return ctx.reply("Вы не являетесь администратором.");
    Lead.findOne({ trader_id: id[0] }, (err, lead) => {
      if (!lead) return ctx.reply("Пользователь не найден");
      try {
        ctx.reply(
          `UID: ${lead.trader_id}\nFTD: ${
            lead.ftd === "false" ? "❌" : "✅"
          }\nСумма депозитов: ${lead.sumdep.length > 0 ? lead.sumdep : "0"}$`
        );
      } catch (err) {
        console.log(err);
      }
    });
  }
});

async function notifAdmins(fields, event) {
  const admins = await Admin.find();
  switch (event) {
    case "reg":
      for (let i = 0; i < admins.length; i++) {
        try {
          bot.telegram.sendMessage(
            admins[i].userID,
            `Новая регистрация!\n\nUID: ${fields.trader_id}\nFTD: ❌\nСумма депозитов: 0$`
          );
        } catch (err) {
          console.log(err);
        }
      }
      break;
    case "ftd":
      for (let i = 0; i < admins.length; i++) {
        try {
          bot.telegram.sendMessage(
            admins[i].userID,
            `Новый FTD!\n\nUID: ${fields.trader_id}\nСумма депозитов: ${
              fields.sumdep.length > 0 ? fields.sumdep : "0"
            }$`
          );
        } catch (err) {
          console.log(err);
        }
      }
      break;
  }
  return;
}

function processFields(fields) {
  Lead.findOne({ trader_id: fields.trader_id }, async (err, lead) => {
    if (lead === null) {
      await new Lead({
        trader_id: fields.trader_id,
        reg: "true",
        ftd: fields.ftd,
        sumdep: fields.sumdep || "0",
      }).save();
      if (fields.ftd === "true") {
        return notifAdmins(fields, "ftd");
      }
      return notifAdmins(fields, "reg");
    } else {
      if (fields.ftd === "true") {
        await Lead.updateOne(
          { trader_id: fields.trader_id },
          { ftd: "true", sumdep: fields.sumdep }
        );
        return notifAdmins(fields, "ftd");
      }
      if (fields.sumdep != lead.sumdep) {
        await Lead.updateOne(
          { trader_id: fields.trader_id },
          { sumdep: fields.sumdep }
        );
        //return notifAdmins(field, 'sumdep');
      }
    }
  });
}

app.get("/postback/sargis", (req, res) => {
  if (req.query.trader_id) {
    processFields(req.query);
  }
  return res.sendStatus(200);
});

bot.launch();
app.listen(port, () => console.log(`Listening at ${port}`));
