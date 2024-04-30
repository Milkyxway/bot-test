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
  const commonCall = (url, method) => {
    return new Promise((resolve, reject) => {
      try {
        fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJjZXNoaTA2IiwidXNlcklkIjoiMTU3NjQ3MzczMDI5NjM1IiwibmFtZSI6IuS4geeQrueQriIsImV4cCI6MTcxNDQ3NTUxM30.lx-PFlGFTLrr3IqO3Nn9-J9RUkfgDp_r9B0HYq1YST1JYCd-Zb3OWMPtazkSPi9QGWniM0nKbD8xzYzINmJfEQiR5dL0a87t58tOPYrp8nujkNHVuvJ2UDqS5f_ovFhdnGu0kGPmY5cNRgoyDBK81MvQ6wiLoYCD1TzQ_3Jk0wE',
          },
          mode: 'no-cors', // 设置cors表示只能发送跨域的请求，no-cors表示跨不跨域都能发
        }).then(res => {
          return res.json();
        }).then(async data => {

          resolve(data.data);
        });
      } catch (e) {
        reject(e);
      }

    });

  };

  const login = () => {

  };

  const commonSendGroupMsg = async (qqEvent, content) => {
    await client.api.sendGroupMessage(qqEvent.group_openid, {
      msg_id: qqEvent.id,
      msg_type: 0,
      content,
    });
  };

  const distinguishApi = async qqEvent => {
    if (qqEvent.content.indexOf('/宽带账号认证') > -1) {
      const account = qqEvent.content.split('认证')[1];
      const url = `http://172.16.251.75:8090/nms/api/fttx/aaa/aaaCertification?accessUserName=${account}`;
      const result = await commonCall(url, 'get');
      commonSendGroupMsg(qqEvent, `\n账号${account}\n宽带账号认证结果\n认证状态: ${result.isPass}\n在线状态:${result.onlineStatus}\n认证服务器: ${result.nickName}\n认证服务器ip: ${result.ip}`);

    } else if (qqEvent.content.indexOf('/CM或ONU快速查询') > -1) {
      const account = qqEvent.content.split('ONU快速查询')[1].replace(/\s*/g, '');
      const result = await commonCall(`http://172.16.251.75:8090/nms/api/fttx/onu/searchOnuList?limit=50&mac=${account}&page=1`, 'get');
      const onuInfo = result?.rows[0];
      const onuId = onuInfo?.id;
      const detailInfo = await commonCall(`http://172.16.251.75:8090/nms/api/fttx/onu/onuDetailInfo?onuId=${onuId}`, 'get');
      const ccNameInfo = await commonCall(`http://172.16.251.75:8090/nms/api/fttx/onu/getCCname?mac=${account}`, 'get');
      commonSendGroupMsg(qqEvent, `\n账号${account}\nCM/ONU快速查询结果\n终端类型: ${onuInfo.onuType}\n机房:${onuInfo.roomName}\n所属头端: ${onuInfo.epon}\n站点:${onuInfo.departName}\n在线状态:${onuInfo.status === 1 ? '在线' : '未知'}\n光功率信号:${detailInfo.onuReceivePower}\n业务类型:${ccNameInfo.ccname}`);
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
