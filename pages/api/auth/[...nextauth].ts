import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import TwitterProvider from "next-auth/providers/twitter";
import FacebookProvider from "next-auth/providers/facebook";
import DiscordProvider from "next-auth/providers/discord";

declare module "next-auth" {
    interface Session {
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }
}

async function refreshAccessToken(provider: string, refreshToken: string) {
    let refreshUrl = '';
    let body = {};

    switch (provider) {
        case 'google':
            refreshUrl = 'https://oauth2.googleapis.com/token';
            body = {
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
            };
            break;

        case 'facebook':
            refreshUrl = 'https://graph.facebook.com/v10.0/oauth/access_token';
            body = {
                grant_type: 'fb_exchange_token',
                client_id: process.env.FACEBOOK_CLIENT_ID,
                client_secret: process.env.FACEBOOK_CLIENT_SECRET,
                fb_exchange_token: refreshToken,
            };
            break;

        case 'discord':
            refreshUrl = 'https://discord.com/api/v10/oauth2/token';
            body = {
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                client_id: process.env.DISCORD_CLIENT_ID,
                client_secret: process.env.DISCORD_CLIENT_SECRET,
            };
            break;

        default:
            throw new Error('Unsupported provider for token refresh.');
    }

    const response = await fetch(refreshUrl, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(`Failed to refresh token: ${data.error_description || data.error}`);
    }

    return data; // 返回新的令牌
}


export default NextAuth({
    providers: [
        CredentialsProvider({
            name: "凭证",
            credentials: {
                email: { label: "电子邮件", type: "text", placeholder: "your-email@example.com" },
                password: { label: "密码", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("请提供有效的电子邮件和密码");
                }

                const res = await fetch("https://yourbackend.com/api/auth/login", {
                    method: "POST",
                    body: JSON.stringify({
                        email: credentials.email,
                        password: credentials.password,
                    }),
                    headers: { "Content-Type": "application/json" },
                });

                const user = await res.json();

                if (res.ok && user) {
                    return user;
                }

                return null;
            },
        }),

        // Google Provider
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),

        // Twitter Provider
        TwitterProvider({
            clientId: process.env.TWITTER_CLIENT_ID || "",
            clientSecret: process.env.TWITTER_CLIENT_SECRET || "",
        }),

        // Facebook Provider
        FacebookProvider({
            clientId: process.env.FACEBOOK_CLIENT_ID || "",
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
        }),

        // Discord Provider
        DiscordProvider({
            clientId: process.env.DISCORD_CLIENT_ID || "",
            clientSecret: process.env.DISCORD_CLIENT_SECRET || "",
        }),

        // You can add WeChat provider here if necessary
    ],
    secret: process.env.NEXTAUTH_SECRET,
    debug: true,

    callbacks: {
        async jwt({ token, user, account }) {
            // 如果是新用户，初始化 token 中的一些值
            if (user && account) {
                token.id = user.id;
                token.email = user.email;
                token.accessToken = account.access_token;
                token.refreshToken = account.refresh_token;
                token.expiresIn = Date.now() + (account.expires_in as number) * 1000; // 强制转换为 number 类型
            }

            // 如果 token 已过期，尝试刷新令牌
            if (token.refreshToken && typeof token.expiresIn === 'number' && Date.now() > (token.expiresIn as number)) {
                try {
                    // 使用类型保护检查 account 是否为 null
                    if (account != null && account.provider != null) {
                        const refreshedTokens = await refreshAccessToken(account.provider as string, token.refreshToken as string);
                        token.accessToken = refreshedTokens.access_token;
                        token.refreshToken = refreshedTokens.refresh_token;
                        token.expiresIn = Date.now() + (refreshedTokens.expires_in as number) * 1000;
                    }
                } catch (error) {
                    console.error("刷新令牌时出错:", error);
                    // 抛出错误或返回默认的 token
                    return token; // 确保始终返回 token
                }
            }

            return token; // 始终返回 token，避免返回 null
        },

        async session({ session, token }) {
            session.accessToken = token.accessToken as string; // 类型断言为 string
            session.refreshToken = token.refreshToken as string; // 类型断言为 string
            session.expiresIn = token.expiresIn as number; // 类型断言为 number
            return session;
        },
    }

});

