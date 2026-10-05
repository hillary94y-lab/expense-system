// Vercel Serverless Function — 安全代理：把真正的 Anthropic API Key 藏在服务器端
// 前端只会打这个 /api/extract 接口，永远看不到真正的 Key
//
// 部署前必做：
// 1. 去 https://console.anthropic.com 申请一个 API Key
// 2. 在 Vercel 项目的 Settings → Environment Variables 里新增一个变量：
//    名称：ANTHROPIC_API_KEY
//    值：你申请到的那串 Key（sk-ant-... 开头）
// 3. 存好后，重新 Deploy 一次（Redeploy），环境变量才会生效

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: { message: 'Method not allowed' } });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: { message: '服务器还没有配置 ANTHROPIC_API_KEY，请到 Vercel 项目的 Environment Variables 里添加后重新部署' }
    });
    return;
  }

  try {
    let body = req.body;
    if (!body || typeof body === 'string') {
      try { body = JSON.parse(body || '{}'); } catch (e) { body = {}; }
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: { message: '调用 Anthropic API 失败：' + err.message } });
  }
};
