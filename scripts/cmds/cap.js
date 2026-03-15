const { createReadStream, unlinkSync, existsSync } = require("fs-extra");
const puppeteer = require("puppeteer");
const { resolve } = require("path");

module.exports = {
    config: {
        name: "cap",
        version: "1.0.2",
        author: "LocDev + Fix",
        description: "Take screenshot facebook wall or website",
        usages: [
            "cap",
            "cap @tag",
            "cap reply",
            "cap <link>"
        ],
        countDown: 5,
        role: 2,
        category: "utility",
        dependencies: {
            puppeteer: "",
            "fs-extra": ""
        }
    },

    onStart: async function ({ api, event, args }) {
        const path = resolve(__dirname, "cache", `cap_${event.threadID}_${event.senderID}.png`);

        try {

            let url = "";

            if (!args[0] || event.type === "message_reply" || Object.keys(event.mentions).length) {
                let uid;

                if (!args[0])
                    uid = event.senderID;

                if (event.type === "message_reply")
                    uid = event.messageReply.senderID;

                if (Object.keys(event.mentions).length)
                    uid = Object.keys(event.mentions)[0];

                url = `https://www.facebook.com/profile.php?id=${uid}`;
            }
            else if (args[0].startsWith("http"))
                url = args[0];

            if (!url)
                return api.sendMessage("❌ Invalid link", event.threadID, event.messageID);

            api.sendMessage("🔄 Loading...", event.threadID, event.messageID);

            const browser = await puppeteer.launch({
                headless: "new",
                args: [
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-accelerated-2d-canvas",
                    "--no-first-run",
                    "--no-zygote",
                    "--disable-gpu"
                ]
            });

            const page = await browser.newPage();

            await page.setViewport({
                width: 1920,
                height: 1080
            });

            // facebook cookie
            if (url.includes("facebook.com")) {
                const cookies = api.getAppState().map(c => ({
                    name: c.key,
                    value: c.value,
                    domain: `.${c.domain}`,
                    path: c.path
                }));

                await page.setCookie(...cookies);
            }

            await page.goto(url, {
                waitUntil: "networkidle2",
                timeout: 0
            });

            await page.waitForSelector("body");

            await page.screenshot({
                path,
                fullPage: true
            });

            await browser.close();

            return api.sendMessage({
                body: "✅ Screenshot done",
                attachment: createReadStream(path)
            },
                event.threadID,
                () => existsSync(path) && unlinkSync(path),
                event.messageID
            );

        }
        catch (err) {
            console.log(err);
            return api.sendMessage("❌ Screenshot failed", event.threadID, event.messageID);
        }
    }
};