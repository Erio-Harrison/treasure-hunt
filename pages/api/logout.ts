import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { provider } = req.query; // 获取认证提供者

        // 检查 provider 是否是字符串类型
        if (typeof provider !== 'string') {
            return res.status(400).json({ message: '无效的 provider' });
        }

        let logoutUrl: string;
        let method: 'GET' | 'POST' = 'GET'; // 请求方法类型
        let headers: { [key: string]: string } = { "Content-Type": "application/json" };

        if (provider === "google") {
            logoutUrl = "https://accounts.google.com/Logout";
        } else if (provider === "facebook") {
            logoutUrl = "https://www.facebook.com/logout.php";
            headers = { "Content-Type": "application/x-www-form-urlencoded" };
        } else if (provider === "discord") {
            logoutUrl = "https://discord.com/api/oauth2/logout";
            method = "POST";
        } else {
            return res.status(400).json({ message: `不支持的 provider: ${provider}` });
        }

        // 发起请求到第三方注销 URL
        const response = await fetch(logoutUrl, {
            method: method,
            credentials: "include", // 保证发送 cookies
            headers: headers,
        });

        if (response.ok) {
            return res.status(200).json({ message: `${provider} 用户已成功注销` });
        } else {
            return res.status(500).json({ message: '远程注销失败' });
        }
    } catch (error) {
        return res.status(500).json({ message: '远程注销失败', error: error instanceof Error ? error.message : '未知错误' });
    }
}
