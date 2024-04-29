const { Controller } = require('egg');

// const { Client } = require('amesu');


class HomeController extends Controller {
  async index() {
    const { ctx } = this;
    ctx.body = 'hi, egg';
    // const { Client } = require('amesu');
    // const client = new Client({
    //   appid: '102099031',
    //   token: 'JC3MBrMGfLT1ORbCfDPFzuOXOEgbuv8n',
    //   secret: 'kLwX9lNzbDpR4hKxaDqU8mQ4iM1gL0fK',
    //   events: [ 'GROUP_MESSAGES', 'PUBLIC_GUILD_MESSAGES' ],
    //   sandbox: true,
    // });

    // // 监听频道消息
    // client.on('at.message.create', async event => {
    //   // 快捷回复
    //   await event.reply({
    //     content: 'hello world',
    //   });
    // });

    // // 监听群聊消息
    // client.on('group.at.message.create', async event => {
    //   console.log(event);
    //   // API 调用
    //   try {
    //     await client.api.sendGroupMessage(event.group_openid, {
    //       msg_id: event.id,
    //       msg_type: 0,
    //       content: 'hello world',
    //     });
    //   } catch (e) {
    //     console.log(e);
    //   }

    // });

    // // 机器人上线
    // client.online();

  }
}

module.exports = HomeController;
