import express from 'express';
import axios from 'axios';
import fs from 'fs';
import os from 'os';
import path from 'path';
import cheerio from 'cheerio';

import {
	fileURLToPath
} from "url"
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express();
const port = process.env.PORT || 3000; // Menggunakan variabel PORT dari lingkungan jika tersedia
const hostname = process.env.HOSTNAME || 'localhost'; // Ganti 'localhost' sesuai dengan hostname Anda


const tempikDir = path.join(__dirname, 'tmp'); // Assuming "temp" is in the same directory as your script
app.use('/tmp', express.static(tempikDir));


app.get("/", (req, res) => {
  res.type("json");

  const keluaran = {
    success: true,
    author: "Nex",
    data: {
      igdl: "/igdl"
    },
  };
  res.send(keluaran);
});

const generateRandomIP = () => {
  const octet = () => Math.floor(Math.random() * 256);
  return `${octet()}.${octet()}.${octet()}.${octet()}`;
};

const checkMediaType = (url) => {
  const supportedImageExtensions = ['jpg', 'jpeg', 'png', 'webp'];
  const supportedVideoExtensions = ['mp4'];
  const fileExtension = url.toLowerCase();
  if (supportedImageExtensions.includes(fileExtension)) {
    return 'image';
  } else if (supportedVideoExtensions.includes(fileExtension)) {
    return 'video';
  } else {
    return 'unknown';
  }
};

function getHostname(){
  const url = "https://downloader-nex.vercel.app";
  return url.includes('http') ? url : `https://${url}`
}


const getMimeTypeFromUrl = async (url) => {
  try {
    const response = await axios.head(url);
    const contentTypeHeader = response.headers['content-type'];
    const [mediaType] = contentTypeHeader.split('/');
    return mediaType;
  } catch (error) {
    console.error('Error:', error.message);
  }
};
//end tools

const igdl1 = async (instagramUrl) => {
  try {
    const base_url = "https://www.save-free.com/";
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Accept': 'text/html, */*; q=0.01',
      'X-Valy-Cache': 'accpted',
      'X-Requested-With': 'XMLHttpRequest',
      'User-Agent': 'Mozilla/5.0 (iPhone14,3; U; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) Version/10.0 Mobile/19A346 Safari/602.1',
      'Referer': 'https://www.save-free.com/',
      'X-Forwarded-For': generateRandomIP(),
    };

    const postData = `instagram_url=${encodeURIComponent(instagramUrl)}&type=media&resource=save`;

    const response = await axios.post(`${base_url}process`, postData, { headers });

    const result = response.data.map(item => ({
      title: item.meta.title,
      urls: item.url.map(urlItem => ({
        url: urlItem.url,
        type: checkMediaType(urlItem.type)
      }))
    }));

    return result;
  } catch (error) {
    console.error(error);
    throw error;
  }
};


const igdl2 = async (instagramUrl) => {
  const headers = {
    'Accept': 'application/json, text/plain, */*',
    'Content-Type': 'application/json',
    'X-XSRF-TOKEN': 'eyJpdiI6InNzNVlEQVJxcVYyVkdvWURBTGNad1E9PSIsInZhbHVlIjoiZkxNOGRKYXREdkVLZWRQeWp1bUFadG5BYWhOTzdoWDlXQ2FaQVwvV2NnZkQ2TzcyYVRuMlNRUkVHam1Nc29KTGRCam16U2xFODZFbkFvYldmdkxUUSt5ZHRyWUljNHZjWk9HZUp4elBxaHFRcGxIUGlxS1hQZUtmTVRoMkxjNVJ1IiwibWFjIjoiOGI0YTA4NmIyODgzZGJmMmIwNzU2MGRiYzk4YjQ5OGUzMzYwZGRiZjEzYjdlYjVjM2NhNTZjMGJiMWViMGU3YSJ9',
    'User-Agent': 'Mozilla/5.0 (Linux; Android 12; SM-A9080 Build/SP1A.210812.016; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/119.0.6045.17 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/436.0.0.35.101;]',
    'Referer': 'https://snapinst.com/'
  };

  const data = {
    url: instagramUrl,
    ts: Date.now(),
    _ts: Date.now(),
    _tsc: 0,
    _s: '045b2f13f32f465471a3cd1af4c63f83b6e50cb54c5c642e3953ef152ef1fea6'
  };

  try {
    const response = await axios.post('https://snapinst.com/api/convert', data, { headers });
    
    const downloadLinks = [];
    let dataArray = response.data; // Declare dataArray using let
    
    await Promise.all(dataArray.map(async (item) => {
      await Promise.all(item.url.map(async (urlItem) => {
        const urlString = urlItem.url;
        const tipe = await getMimeTypeFromUrl(urlString);
        downloadLinks.push({ title: item.meta.title, urls: [{ url: urlString, type: tipe }] });
      }));
    }));

    return downloadLinks;
  } catch (error) {
    console.error(error);
  }
};



async function downloadImage(url) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const tempDir = os.tmpdir();
    const randomCode = Math.random().toString(36).substring(7);
    const imagePath = path.join(tempikDir, `downloaded_image_${randomCode}.png`);

    fs.writeFileSync(imagePath, Buffer.from(response.data, 'binary'));

    return imagePath;
  } catch (error) {
    console.error('Error downloading image:', error.message);
    throw error;
  }
}

async function downloadVideo(url) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const tempDir = os.tmpdir();
    const randomCode = Math.random().toString(36).substring(7);
    const videoPath = path.join(tempikDir, `downloaded_video_${randomCode}.mp4`);

    fs.writeFileSync(videoPath, Buffer.from(response.data, 'binary'));

    return videoPath;
  } catch (error) {
    console.error('Error downloading video:', error.message);
    throw error;
  }
}


// Middleware untuk mengizinkan akses ke direktori os.tmpdir()


app.use(express.json());

// ... (kode sebelumnya)

app.get('/igdl', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'Parameter url is required' });
    }

    if (!/https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)/.test(url)) {
      return res.status(400).json({ error: "Example: https://www.instagram.com/p/Cz1fTwMJFpx/?igsh=MXRrY2g4eWNucGoyZg==" });
    }

    let result;

    try {
      result = await igdl1(url);
    } catch (error1) {
      // If igdl1 encounters an error, try igdl2
      console.error("igdl1 error:", error1);

      try {
        result = await igdl2(url);
      } catch (error2) {
        console.error("igdl2 error:", error2);
        return res.status(400).json({ error: error2 });
      }
    }

    if (!result || result.length === 0) {
      return res.status(400).json({ error: "No media found on the provided Instagram URL." });
    }

    const array_media = [];

    for (const item of result) {
      const { title, urls } = item;
      let captions = `Title: ${title}\n`;

      for (const urlItem of urls) {
        const { url, type } = urlItem;

        if (type === 'image') {
          let path_img = await downloadImage(url);
          array_media.push({ path: path_img, caption: captions, url: `${getHostname()}/${path.basename(path_img)}` });
        } else if (type === 'video') {
          let path_vid = await downloadVideo(url);
          array_media.push({ path: path_vid, caption: captions, url: `${getHostname()}/${tempikDir}/${path.basename(path_vid)}` });
        }
      }
    }
    // Hapus file setelah respons dikirim
    res.json(array_media);
    // Ambil path file dari array_media dan hapus setelah respons dikirim
    array_media.forEach(async (item) => {
      try {
        await fs.promises.unlink(item.path);
        console.log(`File ${item.path} deleted.`);
      } catch (error) {
        console.error(`Error deleting file ${item.path}:`, error);
      }
    });
  } catch (error) {
    console.error('Error processing request:', error.message);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://${hostname}:${port}`);
});
