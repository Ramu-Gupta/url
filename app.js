const http = require("http");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const PORT = 5000;

const Data_File=path.join("data","links.json")

// read data file in jsecon data
const loadLinks = async () => {
  try {
    const data = await fs.readFile(Data_File,'utf-8');
    return JSON.parse(data)
  } catch (error) {
    if(error.code==="ENOENT"){
        await fs.writeFile(Data_File,JSON.stringify({}));
        return {}
    }
    throw error;
  }
};

// save data in file
const savedata = async (links) => {
    await fs.writeFile(Data_File,JSON.stringify(links))
};

// show file code

const ShowFile = async (res, filepath, ContentType) => {
  try {
    const data = await fs.readFile(filepath);
    res.writeHead(200, { "Content-Type": ContentType });
    res.end(data);
  } catch (error) {
    res.writeHead(404, { "Content-Type": "Text/plain" });
    res.end("404 page not found");
  }
};

const Sever = http.createServer(async (req, res) => {
  if (req.method === "GET") {
    if (req.url === "/") {
      return ShowFile(res, path.join("public", "index.html"), "text/html");
    } else if (req.url === "/style.css") {
      return ShowFile(res, path.join("public", "style.css"), "text/css");
    }else if(req.url==="/api/links/Data"){
        const links = await loadLinks();
        res.writeHead(200,{"content-type":"aplication/json"})
        res.end(JSON.stringify(links));
    } else {

       const links = await loadLinks();
       const linkcode=req.url.slice(1)
       if(links[linkcode]){
        res.writeHead(302,{location:links[linkcode]});
        return res.end()
       }

    }

     res.writeHead(404,{"content-type":"text/plain"});
       res.end("page not found ")
       
  } else if (req.method === "POST") {
    if (req.url === "/api/data") {
      let body = "";

      const links = await loadLinks();

      req.on("data", (chunk) => {
        body += chunk;
      });

      req.on("end", async () => {
        const { url, shortCode } = JSON.parse(body);

        if (!url) {
          res.writeHead(400, { "content-type": "text/plain" });
          return res.end("URL Feild required");
        }

        const finalshortCode = shortCode || crypto.randomBytes(4).toString("hex");

        if(links[finalshortCode]){
            res.writeHead(400,{"content-type":"text/plain"});
            return res.end("short code alreday exists,please choose another")
        }

        links[finalshortCode]=url;

        await savedata(links)

        res.writeHead(200,{"content-type":"aplication/json"});
        res.end(JSON.stringify({success:true, shortCode:finalshortCode}));

      });
    }
  }
});

Sever.listen(PORT, () => {
  console.log(`sever is running at http://localhost:${PORT}`);
});
