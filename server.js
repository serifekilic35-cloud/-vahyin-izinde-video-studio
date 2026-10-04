const http = require("http");
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {

  // Ana sayfa
  if (req.method === "GET" && req.url === "/") {
    fs.readFile(path.join(__dirname, "index.html"), (err, data) => {
      if (err) {
        res.writeHead(500);
        return res.end("index.html bulunamadi");
      }

      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8"
      });

      res.end(data);
    });

    return;
  }

  // Video oluşturma
  if (req.method === "POST" && req.url === "/api/render") {

    let body = "";

    req.on("data", chunk => {
      body += chunk;
    });

    req.on("end", () => {
      let data;

      try {
        data = JSON.parse(body || "{}");
      } catch {
        res.writeHead(400, {
          "Content-Type": "application/json"
        });
        return res.end(JSON.stringify({
          error: "Gecersiz veri"
        }));
      }

      const duration = Math.min(
        Math.max(Number(data.duration) || 10, 3),
        60
      );

      const output = path.join(
        "/tmp",
        "vahyin-izinde-" + Date.now() + ".mp4"
      );

      const args = [
        "-f", "lavfi",
        "-i", "color=c=0x081820:s=1080x1920:r=30",
        "-t", String(duration),
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        "-y",
        output
      ];

      execFile("ffmpeg", args, (error) => {

        if (error) {
          console.error(error);

          res.writeHead(500, {
            "Content-Type": "application/json"
          });

          return res.end(JSON.stringify({
            error: "Video olusturulamadi"
          }));
        }

        const stat = fs.statSync(output);

        res.writeHead(200, {
          "Content-Type": "video/mp4",
          "Content-Length": stat.size,
          "Content-Disposition":
            'attachment; filename="vahyin-izinde.mp4"'
        });

        const stream = fs.createReadStream(output);

        stream.pipe(res);

      res.on("finish", () => {
  setTimeout(() => {
    fs.unlink(output, () => {});
  }, 60000);
});
      });
    });

    return;
  }

  res.writeHead(404);
  res.end("Bulunamadi");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("Vahyin Izinde Video Studio calisiyor: " + PORT);
});