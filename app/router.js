/**
 * @param {Egg.Application} app - egg application
 */
module.exports = async app => {
  const { router, controller } = app;
  router.get('/', controller.home.index);
  const { Client } = require('amesu');
  let token;
  const client = new Client({
    appid: '102099031',
    token: 'JC3MBrMGfLT1ORbCfDPFzuOXOEgbuv8n',
    secret: 'kLwX9lNzbDpR4hKxaDqU8mQ4iM1gL0fK',
    events: [ 'GROUP_MESSAGES', 'PUBLIC_GUILD_MESSAGES' ],
    sandbox: true,
    log_level: 'ALL',
  });

  /**
   * 通用的api请求
   * @param {*} url
   * @param {*} method
   * @param {*} noToken
   * @return
   */
  const commonCall = (url, method, noToken = false) => {
    return new Promise((resolve, reject) => {
      try {
        fetch(url, {
          method,
          headers: noToken ? { 'Content-Type': 'application/json' } : {
            'Content-Type': 'application/json',
            Authorization: token,
          },
          mode: 'no-cors', // 设置cors表示只能发送跨域的请求，no-cors表示跨不跨域都能发
        }).then(res => {
          return res.json();
        }).then(async data => {
          if (data.status === 200) {

            resolve(data.data);
          } else {
            reject(data.message);
          }

        });
      } catch (e) {
        console.log(e);
        reject(e);
      }

    });

  };


  const formatResultStr = (directiveName, account, result) => {
    let str = '';
    Object.keys(result).map(i => {
      str += `\n${i}:${result[i]}`;
      // return str;
    });
    return `\n账号${account}\n${directiveName}结果${str}`;
  };

  /**
   * 获取最新token
   * @return
   */
  const getLastestToken = () => {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await commonCall('http://172.16.251.75:8090/nms/api/admin/login?loginName=ceshi06&pwd=023e1e2ab4a2746d28cd3688e867825f', 'post', true);
        token = result.token;
        resolve();
      } catch (e) {
        reject(e);
      }
    });

  };


  /**
   * 通用机器人发送群聊消息
   * @param {*} qqEvent
   * @param {*} content
   */
  const commonSendGroupMsg = async (qqEvent, content) => {
    await client.api.sendGroupMessage(qqEvent.group_openid, {
      msg_id: qqEvent.id,
      msg_type: 0,
      content,
    });
  };

  const statusMap = status => {
    const map = {
      1: '极差',
      2: '差',
      3: '中',
      4: '良好',
      5: '优秀',
    };
    return map[status];
  };
  const getOnuInfo = async (qqEvent, account, onuInfo) => {
    try {
      const detailInfo = await commonCall(`http://172.16.251.75:8090/nms/api/fttx/onu/onuDetailInfo?onuId=${onuInfo.onuId || onuInfo.id}`, 'get');
      const ccNameInfo = await commonCall(`http://172.16.251.75:8090/nms/api/fttx/onu/getCCname?mac=${account}`, 'get');
      commonSendGroupMsg(qqEvent, formatResultStr('CM/ONU快速查询结果', account, { 终端类型: onuInfo.onuType, 机房: onuInfo.roomName, 所属头端: onuInfo.epon, 站点: onuInfo.departName, 在线状态: onuInfo.status === 1 ? '在线' : '未知', 光功率信号: detailInfo.onuReceivePower, 业务类型: ccNameInfo.ccname }));
    } catch (e) {
      commonSendGroupMsg(qqEvent, e);
    }

  };

  const getCmInfo = async (qqEvent, account) => {
    try {
      const detailInfo = await commonCall(`http://172.16.251.75:8090/nms/api/app/cmInfo/get_cm_cmts_user_info2?mac=${account}`, 'get');
      const ccNameInfo = await commonCall(`http://172.16.251.75:8090/nms/api/fttx/onu/getCCname?mac=${account}`, 'get');
      commonSendGroupMsg(qqEvent, formatResultStr('CM/ONU快速查询结果', account, { 配置文件: detailInfo?.cmInfo?.cmConfig, 下行带宽: detailInfo?.cmInfo?.downConfigWidth, 上行带宽: detailInfo?.cmInfo?.upConfigWidth, ccName: ccNameInfo.ccname, CM上行参数: '', 上行物理端口: detailInfo?.upPortInfo[0]?.upPhyPort, 上行逻辑端口: detailInfo?.upPortInfo[0]?.upPort, 上行状态: statusMap(detailInfo?.upPortInfo[0]?.status), 端口SNR: detailInfo?.upPortInfo[0]?.cmUpSnr,
        CM下行参数: '', 下行物理端口: detailInfo?.downPortInfo[0]?.upPhyPort, 下行逻辑端口: detailInfo?.downPortInfo[0]?.upPort, 下行状态: statusMap(detailInfo?.downPortInfo[0]?.status), 下行端口SNR: detailInfo?.downPortInfo[0]?.cmUpSnr }));
    } catch (e) {
      commonSendGroupMsg(qqEvent, e);
    }

  };


  /**
   * 区分指令调用不同接口
   * @param {*} qqEvent
   */
  const distinguishApi = async qqEvent => {
    if (qqEvent.content.indexOf('/宽带账号认证') > -1) {
      const account = qqEvent.content.split('认证')[1].replace(/\s*/g, '');
      const url = `http://172.16.251.75:8090/nms/api/fttx/aaa/aaaCertification?accessUserName=${account}`;
      try {
        const result = await commonCall(url, 'get');
        commonSendGroupMsg(qqEvent, formatResultStr('宽带账号认证结果', account, { 认证状态: result.isPass, 在线状态: result.onlineStatus, 认证服务器: result.nickName, 认证服务器ip: result.ip }));
      } catch (e) {
        commonSendGroupMsg(qqEvent, e);
      }
    } else if (qqEvent.content.indexOf('/CM或ONU快速查询') > -1) {
      try {
        const account = qqEvent.content.split('ONU快速查询')[1].replace(/\s*/g, '');
        const result = await commonCall(`http://172.16.251.75:8090/nms/api/fttx/onu/searchOnuList?limit=50&mac=${account}&page=1`, 'get');
        const onuInfo = result?.rows[0];
        const type = onuInfo.onuType;

        type.toLowerCase().indexOf('onu') > -1 ? getOnuInfo(qqEvent, account, onuInfo) : getCmInfo(qqEvent, account);
      } catch (e) {
        commonSendGroupMsg(qqEvent, e);
      }
    } else {
      commonSendGroupMsg(qqEvent, qqEvent.content);
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

  await getLastestToken();

  // 机器人上线
  client.online();


};
