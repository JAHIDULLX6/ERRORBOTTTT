const fs = require("fs-extra");
const Canvas = require("canvas");
const superfetch = require("node-superfetch");
const Jimp = require("jimp-compact");

module.exports = {
  config: {
    name: "boximage",
    version: "1.0.2",
    author: "SaGor",
    countDown: 5,
    role: 0,
    shortDescription: "Create a photo of all members in the box.",
    longDescription:
      "Combine all the group members' avatars into one large image and create an avatar-only version.",
    category: "group",
    guide: "{pn} <size> [#màu] [title]"
  },


  circle: async function (image) {
    const img = await Jimp.read(image);
    img.circle();
    return await img.getBufferAsync(Jimp.MIME_PNG);
  },

  onStart: async function ({ message, event, args, api }) {
    try {
      const { threadID } = event;


      const threadInfo = await api.getThreadInfo(threadID);
      const { participantIDs, adminIDs, name, userInfo } = threadInfo;


      const live = [];
      const admin = adminIDs.map(a => a.id);
      for (let u of userInfo) {
        if (u.gender != undefined) live.push(u);
      }

      // Load background random
      const bgList = [
        "https://i.imgur.com/P3QrAgh.jpg",
        "https://i.imgur.com/RueGAGI.jpg",
        "https://i.imgur.com/bwMjOdp.jpg",
        "https://i.imgur.com/trR9fNf.jpg"
      ];
      const background = await Canvas.loadImage(
        bgList[Math.floor(Math.random() * bgList.length)]
      );
      const bgX = background.width;
      const bgY = background.height;

      const khungAvt = await Canvas.loadImage("https://i.imgur.com/gYxZFzx.png");


      const imgCanvas = Canvas.createCanvas(bgX, bgY);
      const ctx = imgCanvas.getContext("2d");
      ctx.drawImage(background, 0, 0, bgX, bgY);

      const imgCanvasAvtOnly = Canvas.createCanvas(bgX, bgY);
      const ctxAvtOnly = imgCanvasAvtOnly.getContext("2d");

      let size, color, title;
      const imageArea = bgX * (bgY - 200);
      const sizeParti = Math.floor(imageArea / live.length);
      const sizeAuto = Math.floor(Math.sqrt(sizeParti));

      if (!args[0]) {
        size = sizeAuto;
        color = "#FFFFFF";
        title = name;
      } else {
        size = parseInt(args[0]);
        color = args[1] || "#FFFFFF";
        title = args.slice(2).join(" ") || name;
      }


      let l = parseInt(size / 15),
        x = parseInt(l),
        y = parseInt(200),
        xcrop = parseInt(live.length * size),
        ycrop = parseInt(200 + size);
      size = size - l * 2;


      await message.reply(
        `📌 Expected members: ${participantIDs.length}\n🖼️ Background: ${bgX} x ${bgY}\n👤 Avatar: ${size}\n🎨 Text color: ${color}\n🔄 It's being processed...`
      );


      let i = 0;
      for (let idUser of live) {
        try {
          const avtUser = await superfetch.get(
            `https://graph.facebook.com/${idUser.id}/picture?height=720&width=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`
          );
          const avatar = await this.circle(avtUser.body);
          const avatarload = await Canvas.loadImage(avatar);


          ctx.drawImage(avatarload, x, y, size, size);
          ctxAvtOnly.drawImage(avatarload, x, y, size, size);


          if (admin.includes(idUser.id)) {
            ctx.drawImage(khungAvt, x, y, size, size);
            ctxAvtOnly.drawImage(khungAvt, x, y, size, size);
          }

          i++;
          x += parseInt(size + l);
          if (x + size > bgX) {
            xcrop = x;
            x = l;
            y += size + l;
            ycrop += size + l;
          }
          if (ycrop > bgY) {
            ycrop -= size;
            break;
          }
        } catch (e) {
          continue;
        }
      }


      ctx.font = "100px sans-serif";
      ctx.fillStyle = color;
      ctx.textAlign = "center";
      ctx.fillText(title, xcrop / 2, 133);


      const pathAVT = `${__dirname}/cache/${Date.now()}.png`;
      const cutImage = await Jimp.read(imgCanvas.toBuffer());
      await cutImage.crop(0, 0, xcrop, ycrop + l - 30).writeAsync(pathAVT);


      const pathAVTOnly = `${__dirname}/cache/${Date.now()}_only.png`;
      const cutImageOnly = await Jimp.read(imgCanvasAvtOnly.toBuffer());
      await cutImageOnly.crop(0, 0, xcrop, ycrop + l - 30).writeAsync(pathAVTOnly);


      await message.reply({
        body: `✅ Drawn ${i} avatar\n⚠️ Filter ${participantIDs.length - i} unavailable`,
        attachment: [
          fs.createReadStream(pathAVT),
          fs.createReadStream(pathAVTOnly)
        ]
      });


      fs.unlinkSync(pathAVT);
      fs.unlinkSync(pathAVTOnly);
    } catch (e) {
      return message.reply("❌ Lỗi: " + e.message);
    }
  }
};