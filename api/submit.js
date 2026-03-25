// api/submit.js
const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // 解决跨域问题，让所有访客都能正常提交
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 预检请求直接放行，不用处理
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 只接受POST请求
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, msg: '请求方式错误' });
    }

    // 从前端获取用户填的留言内容（新增category）
    const { nickname, message, category } = req.body;

    // 校验留言内容不能为空
    if (!message || !message.trim()) {
        return res.status(400).json({ success: false, msg: '请输入留言内容！' });
    }

    // --- 这里改成你自己的信息，2处都要改！---
    const GITHUB_USERNAME = 'liugubu'; // 改成你的GitHub用户名
    const GITHUB_REPO_NAME = 'my-secret-message-board'; // 改成你的仓库名
    // ------------------------------------------

    // 从Vercel后台读取你的GitHub Token，绝对安全，前端看不到
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

    // 新增：环境变量校验
    if (!GITHUB_TOKEN) {
        return res.status(500).json({ success: false, msg: '服务器配置错误：缺少GitHub Token' });
    }
    if (!GITHUB_USERNAME || !GITHUB_REPO_NAME) {
        return res.status(500).json({ success: false, msg: '服务器配置错误：缺少GitHub用户名/仓库名' });
    }

    try {
        // 核心：在后端（用户看不到的地方）调用GitHub API创建Issue
        const githubResponse = await fetch(`https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO_NAME}/issues`, {
            method: 'POST',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
                'User-Agent': 'My-Message-Board'
            },
            body: JSON.stringify({
                title: `来自 ${nickname || '匿名用户'} 的留言 [${category || '未分类'}]`,
                body: `
### 留言信息
- 昵称：${nickname || '匿名用户'}
- 分类：${category || '未分类'}
- 时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}

---

### 留言内容
${message}
                `
            })
        });

        if (githubResponse.ok) {
            return res.status(200).json({ success: true, msg: '留言提交成功！' });
        } else {
            const errorInfo = await githubResponse.json();
            return res.status(500).json({ success: false, msg: '提交失败', error: errorInfo.message });
        }

    } catch (err) {
        console.error('服务器错误：', err);
        return res.status(500).json({ success: false, msg: '服务器出错了，请稍后再试' });
    }
};