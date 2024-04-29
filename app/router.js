/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  router.get('/', controller.home.index);
  const { Client } = require('amesu');
  const client = new Client({
    appid: '102099031',
    token: 'JC3MBrMGfLT1ORbCfDPFzuOXOEgbuv8n',
    secret: 'kLwX9lNzbDpR4hKxaDqU8mQ4iM1gL0fK',
    events: [ 'GROUP_MESSAGES', 'PUBLIC_GUILD_MESSAGES' ],
    sandbox: true,
    log_level: 'ALL',
  });
  const commonCall = (url, method, callback) => {
    fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJjZXNoaTA2IiwidXNlcklkIjoiMTU3NjQ3MzczMDI5NjM1IiwibmFtZSI6IuS4geeQrueQriIsImV4cCI6MTcxNDM5NTA2M30.Xd6dk8w0dKginHdQl5Qo25K6BkOLTwtpbKKA4VhaiVqpZ3gh_HMaS9h95dTFKYv8du2944RZwtrDKJEc-yYS3B_qnLboZwrHKWD_EVaQsFkHYdGnoJU4hYmSwaviRlHiOY_pYYZwpdZWimIxLqzj0YUlkvleu_-7V2g06gVS670',
      },
      mode: 'no-cors', // 设置cors表示只能发送跨域的请求，no-cors表示跨不跨域都能发
    }).then(res => {
      return res.json();
    }).then(async data => {
      callback(data.data);
    });
  };

  const distinguishApi = async qqEvent => {
    if (qqEvent.content.indexOf('/宽带账号认证') > -1) {
      const account = qqEvent.content.split('认证')[1];
      const url = `http://172.16.251.75:8090/nms/api/fttx/aaa/aaaCertification?accessUserName=${account}`;
      commonCall(url, 'get', async data => {
        await client.api.sendGroupMessage(qqEvent.group_openid, {
          msg_id: qqEvent.id,
          msg_type: 0,
          content: `\n账号${account}宽带账号认证结果\n认证状态: ${data.isPass}\n在线状态：${data.onlineStatus}\n认证服务器: ${data.nickName}\n认证服务器ip: ${data.ip}`,
        });
      });
    } else {
      await client.api.sendGroupMessage(qqEvent.group_openid, {
        msg_id: qqEvent.id,
        msg_type: 0,
        content: qqEvent.content,
      });
    }

  };


  // 监听频道消息
  client.on('at.message.create', async event => {
    // 快捷回复
    await event.reply({
      content: 'hello world',
    });
  });

  // 监听群聊消息
  client.on('group.at.message.create', async event => {
    distinguishApi(event);

  });

  // 机器人上线
  client.online();
};
