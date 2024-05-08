import axios from 'axios';
import cheerio from 'cheerio';
import { createRequire } from 'module';
import os from 'os';
import express from 'express';
import { promisify } from 'util';
import { fileTypeFromBuffer } from 'file-type';

const require = createRequire(import.meta.url);
const fs = require('fs').promises;
const path = require('path');


const { google } = require('googleapis');
const fss = require('fs');
const axios = require('axios');
const { tmpdir } = require('os');
const nodeID3 = require('node-id3');
const ytdl = require('ytdl-core');

const youtube = google.youtube({ version: 'v3', auth: 'AIzaSyBPkpdJEGtAHebbaP3_CcA1_urfMFfeLLg' });

const getVideoInfo = async (url) => {
  try {
    const info = await ytdl.getInfo(url);
    const videoInfo = {
      title: info.videoDetails.title,
      year: info.videoDetails.publishDate.substring(0, 4),
      thumbnail: info.videoDetails.thumbnails[0].url,
      artist: info.videoDetails.author.name,
      channel: info.videoDetails.ownerChannelName
    };
    return videoInfo;
  } catch (error) {
    console.error('Error fetching video info:', error);
    throw new Error('An error occurred while fetching video info.');
  }
};

const readFileAsBuffer = async (filePath) => {
  try {
    return await fss.promises.readFile(filePath);
  } catch (error) {
    console.error('Error reading file:', error);
    throw new Error('An error occurred while reading the file.');
  }
};

const addAudioTags = async (media, title, artist, year, imagecover) => {
  try {
    let audioBuffer = (typeof media === 'string') ? Buffer.from((await axios.get(media, { responseType: 'arraybuffer', maxContentLength: -1 })).data) : (media instanceof Buffer) ? media : (() => { throw new Error('Media harus berupa URL string atau Buffer.'); })();
    const randomFilename = title.replace(/[^\w\s\#\$\&\-\+\(\)\/\[\]\`\×\{\}\\\\\~\•]/g, '') + '.mp3';
    const tmpFilePath = path.join(tempDir, randomFilename);
    fss.writeFileSync(tmpFilePath, audioBuffer);
    const tags = { title, artist, year };
    if (typeof imagecover === 'string') {
      const coverBuffer = Buffer.from((await axios.get(imagecover, { responseType: 'arraybuffer' })).data);
      tags.image = { mime: 'image/jpeg', type: { id: 3, name: 'Front Cover' }, description: 'Cover', imageBuffer: coverBuffer };
    } else if (imagecover instanceof Buffer) {
      tags.image = { mime: 'image/jpeg', type: { id: 3, name: 'Front Cover' }, description: 'Cover', imageBuffer: imagecover };
    }
    const success = nodeID3.write(tags, tmpFilePath);
    console[success ? 'log' : 'error'](success ? 'Tag ID3 berhasil diubah!' : 'Gagal mengubah tag ID3.');
    return { msg: `Audio berhasil diubah.`, path: `${tmpFilePath}` };
  } catch (error) {
    console.error('Terjadi kesalahan:', error);
    throw new Error('Terjadi kesalahan saat mengubah audio.');
  }
};

const listPlaylistVideos = async (playlist) => {
  try {
    const playlistId = playlist.startsWith("https") ? playlist.match(/list=([^&]+)/)[1] : playlist;
    let nextPageToken = null;
    let videos = [];
    do {
      const response = await youtube.playlistItems.list({ part: 'snippet', playlistId, maxResults: 50, pageToken: nextPageToken });
      const videoIds = response.data.items.map(item => item.snippet.resourceId.videoId).join(',');
      const videoDetailsResponse = await youtube.videos.list({ part: 'contentDetails', id: videoIds });
      const videoDetailsMap = new Map(videoDetailsResponse.data.items.map(item => [item.id, item.contentDetails.duration]));
      videos = videos.concat(response.data.items.map(item => {
        const videoId = item.snippet.resourceId.videoId;
        const duration = videoDetailsMap.get(videoId);
        return duration ? { url: `https://www.youtube.com/watch?v=${videoId}`, title: item.snippet.title, thumbnailUrl: item.snippet.thumbnails.default.url, duration: parseISO8601(duration) } : null;
      }).filter(Boolean));
      nextPageToken = response.data.nextPageToken;
    } while (nextPageToken);
    return videos;
  } catch (error) {
    console.error('Terjadi kesalahan:', error);
    throw new Error('Terjadi kesalahan saat memuat daftar video dalam playlist.');
  }
};

function parseISO8601(duration) {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  const hours = (match[1] && parseInt(match[1])) || 0;
  const minutes = (match[2] && parseInt(match[2])) || 0;
  const seconds = (match[3] && parseInt(match[3])) || 0;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

const YouTubeAudio = async (url) => {
  const YouTubeAudio1 = async (urlyt) => {
    try {
      const init = await axios.get('https://nu.mnuu.nu/api/v1/init?p=y&23=1llum1n471');
      const convert = await axios.get(init.data.convertURL, { params: { v: urlyt, f: 'mp3', _: Date.now() } });
      const final = await axios.get(convert.data.redirectURL, { params: { v: urlyt, f: 'mp3', _: Date.now() } });
      const progress = await axios.get(final.data.progressURL);
      return { title: progress.data.title, downloadURL: final.data.downloadURL };
    } catch (error) {
      console.error('Error:', error.message);
      throw error;
    }
  };

  const YouTubeAudio2 = async (url) => {
    try {
      const info = await ytdl.getInfo(url);
      const formats = ytdl.filterFormats(info.formats, 'audioonly');
      if (formats.length === 0) throw new Error('Tidak ada format audio yang tersedia untuk video ini.');
      const audioFormat = formats[0];
      return { title: info.videoDetails.title, downloadURL: audioFormat.url };
    } catch (error) {
      console.error('Terjadi kesalahan:', error);
      throw new Error('Terjadi kesalahan saat mengunduh audio dari YouTube.');
    }
  };

  const YouTubeAudio3 = async (url) => {
    try {
      const response = await axios.post('https://co.wuk.sh/api/json', { url, vQuality: '360', filenamePattern: 'pretty', isAudioOnly: 'true' }, { headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36', 'Referer': 'https://cobalt.tools/' } });
      const info = await ytdl.getInfo(url);
      return { title: info.videoDetails.title, downloadURL: response.data.url };
    } catch (error) {
      console.error('Terjadi kesalahan saat mengambil informasi audio dari API:', error);
      console.log('Menggunakan fungsi pengganti untuk mengunduh dari YouTube...');
      try {
        return await YouTubeAudio2(url);
      } catch (ytdlError) {
        console.error('Terjadi kesalahan saat mengunduh dari YouTube:', ytdlError);
        throw new Error('Terjadi kesalahan baik saat mengambil informasi audio dari API maupun saat mengunduh dari YouTube.');
      }
    }
  };

  try {
    return await YouTubeAudio3(url);
  } catch (error) {
    console.error('Terjadi kesalahan saat menjalankan YouTubeAudio3:', error);
    try {
      return await YouTubeAudio1(url);
    } catch (ytdlError) {
      console.error('Terjadi kesalahan saat menjalankan YouTubeAudio1:', ytdlError);
      try {
        return await YouTubeAudio2(url);
      } catch (YouTubeAudio2Error) {
        console.error('Terjadi kesalahan saat menjalankan YouTubeAudio2:', YouTubeAudio2Error);
        throw new Error('Semua fungsi gagal. Tidak dapat mengunduh audio dari YouTube.');
      }
    }
  }
};

const getHDThumbnailUrl = async (videoId) => {
  try {
    const response = await youtube.videos.list({ part: 'snippet', id: videoId });
    return response.data.items[0].snippet.thumbnails.maxres.url;
  } catch (error) {
    console.error('Error fetching HD thumbnail URL:', error.message);
    return null;
}};

const GetId = (data) => {
  const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtu(?:be\.com\/(?:watch\?(?:v=|vi=)|v\/|vi\/)|\.be\/|be\.com\/embed\/|be\.com\/shorts\/)|youtube\.com\/\?(?:v=|vi=))([\w-]{11})/;
  const res = regex.exec(data);
  if (res && res[1]) return res[1];
  throw new Error("Please check the URL you have entered");
};



const generateRandomIP = () => {
    const octet = () => Math.floor(Math.random() * 256);
    return `${octet()}.${octet()}.${octet()}.${octet()}`;
};

async function igdl1(url) {
    const apiEndpoint = 'https://v3.igdownloader.app/api/ajaxSearch';
    const requestOptions = {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Accept': '*/*',
            'User-Agent': 'Mozilla/5.0 (Linux; Android 12; SM-S908B Build/SP1A.210812.016; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/99.0.4844.58 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/357.0.0.23.115;]',
            'Referer': 'https://igdownloader.app/en',
            'X-Forwarded-For': generateRandomIP()
        },
    };
    const postData = `recaptchaToken=&q=${encodeURIComponent(url)}&t=media&lang=en`;
    try {
        const response = await axios.post(apiEndpoint, postData, requestOptions);
        const $ = cheerio.load(response.data.data);
        const downloadLinks = $('div.download-items__btn > a');
        return await Promise.all(downloadLinks.map(async (index, element) => $(element).attr('href')));
    } catch (error) {
        console.error('Instagram Downloader 1 - Error:', error.message);
        return null;
    }
}

async function igdl2(url) {
    try {
        const response = await axios.post('https://fastdl.app/c/', {
            url: url,
            lang_code: 'en',
            token: ''
        }, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Accept': '*/*',
                'X-Requested-With': 'XMLHttpRequest',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
                'Referer': 'https://fastdl.app/'
            },
            responseType: 'arraybuffer'
        });
        const html = response.data.toString('utf-8');
        const $ = cheerio.load(html);
        $('img').remove();
        const links = [];
        $('a').each((index, element) => links.push($(element).attr('href')));
        return links;
    } catch (error) {
        console.error('Error downloading Instagram post:', error);
        return null;
    }
}

async function igdl3(url) {
    const apiEndpoint = 'https://co.wuk.sh/api/json';
    const requestData = { url, aFormat: 'mp3', filenamePattern: 'classic', dubLang: false, vQuality: '720' };
    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'Referer': 'https://cobalt.tools/',
    };
    try {
        const response = await axios.post(apiEndpoint, requestData, { headers });
        const array_res = [];
        if (response.data.status === 'redirect') {
            array_res.push(response.data.url);
        } else if (response.data.status === 'picker') {
            response.data.picker.forEach(item => array_res.push(item.url));
        }
        return array_res;
    } catch (error) {
        console.error('Instagram Downloader 3 - Error:', error.message);
        return null;
    }
}

async function igdl4(url) {
    try {
        const apiEndpoint = 'https://v3.saveig.app/api/ajaxSearch';
        const requestOptions = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Accept': '*/*',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 12; SM-S908B Build/SP1A.210812.016; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/99.0.4844.58 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/357.0.0.23.115;]',
                'Referer': 'https://saveig.app/en',
            },
        };
        const postData = `recaptchaToken=&q=${encodeURIComponent(url)}&t=media&lang=en`;
        const response = await axios.post(apiEndpoint, postData, requestOptions);
        const $ = cheerio.load(response.data.data);
        const downloadLinks = $('div.download-items__btn > a');
        return await Promise.all(downloadLinks.map(async (index, element) => $(element).attr('href')));
    } catch (error) {
        console.error('Instagram Downloader 4 - Error:', error.message);
        return null;
    }
}

async function twdl1(url) {
    const apiUrl = 'https://savetwitter.net/api/ajaxSearch';
    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Accept': '*/*',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 12; SM-S908B Build/SP1A.210812.016; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/99.0.4844.58 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/357.0.0.23.115;]',
        'Referer': 'https://x2twitter.com/id',
        'X-Forwarded-For': generateRandomIP(),
    };
    const data = `q=${encodeURIComponent(url)}&lang=id`;

    try {
        const response = await axios.post(apiUrl, data, {
            headers
        });
        if (!response.data.hasOwnProperty('data')) {
            throw new Error('Data tidak ditemukan di response');
        }
        const $ = cheerio.load(response.data.data);

        $('a[onclick="showAd()"][href="#"]').remove();
        $('a[href="/"]').remove();
        $('a[href="#"]').remove();

        const hrefs = [];
        $('.dl-action').each((index, element) => {
            const firstAnchor = $(element).find('a').first();
            hrefs.push(firstAnchor.attr('href'));
        });

        return hrefs;

    } catch (error) {
        throw new Error('Failed to fetch Twitter image: ' + error);
    }
}



async function twdl2(url) {
    const apiUrl = 'https://x2twitter.com/api/ajaxSearch';
    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Accept': '*/*',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 12; SM-S908B Build/SP1A.210812.016; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/99.0.4844.58 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/357.0.0.23.115;]',
        'Referer': 'https://x2twitter.com/id',
        'X-Forwarded-For': generateRandomIP(),
    };
    const data = `q=${encodeURIComponent(url)}&lang=id`;

    try {
        const response = await axios.post(apiUrl, data, {
            headers
        });
        if (!response.data.hasOwnProperty('data')) {
            throw new Error('Data tidak ditemukan di response');
        }
        const $ = cheerio.load(response.data.data);

        $('a[onclick="showAd()"][href="#"]').remove();
        $('a[href="/"]').remove();

        const hrefs = [];
        $('.dl-action').each((index, element) => {
            const firstAnchor = $(element).find('a').first();
            hrefs.push(firstAnchor.attr('href'));
        });

        return hrefs;

    } catch (error) {
        throw new Error('Failed to fetch Twitter image: ' + error);
    }
}



async function twdl3(url) {
    const apiUrl = 'https://twtube.app/en/download?url=';

    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Accept': '*/*',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 12; SM-S908B Build/SP1A.210812.016; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/99.0.4844.58 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/357.0.0.23.115;]',
        'Referer': 'https://savetwitter.net/id/twitter-image-downloader',
        'X-Forwarded-For': generateRandomIP(),
    };
    try {
        const response = await axios.get(apiUrl + url, {
            headers
        });
        const $ = cheerio.load(response.data);
        // Mendapatkan semua href dari elemen a dalam div dengan kelas 'square-box-btn'
        const allHrefs = [];
        // Menggunakan map untuk mengambil href dan mengembalikan array promise
        const promises = $('.square-box-btn a').map(async (index, element) => {
            let link = $(element).attr('href');
            return link;
        }).get();
        // Menunggu semua promise selesai dan mengumpulkan hasilnya
        return Promise.all(promises);
    } catch (error) {
        throw new Error('Failed to fetch Twitter image: ' + error);
    }
}

const PORT = process.env.PORT || 5000;
const app = express();
const readFileAsync = promisify(fs.readFile);
const tempDir = path.join(os.tmpdir(), "temp");
const fss = require("fs")
if (!fss.existsSync(tempDir)) {
    fss.mkdirSync(tempDir, { recursive: true });
}

async function DownloadFile(url) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const mimeType = response.headers['content-type'];
        const buffer = response.data;
        const fileExtension = (await fileTypeFromBuffer(buffer)).ext;
        const filename = `downloaded_file_${Date.now()}.${fileExtension}`;
        const filePath = path.join(tempDir, filename);
        await fs.writeFile(filePath, buffer);
        console.log(`File berhasil diunduh dan disimpan sebagai: ${filePath}`);
        return { mimeType, filePath };
    } catch (error) {
        console.error('Error saat mengunduh file:', error);
        return null;
    }
}

app.use('/temp', express.static(tempDir));
app.use(express.json());

app.get("/", (req, res) => {
    res.type("json");
    const keluaran = {
        success: true,
        author: "Nex",
        data: {
            igdl: "/igdl",
            twdl: "/twdl"
        },
    };
    res.send(keluaran);
});

const getInstagramDownloadLinks = async (url) => {
    let result = await igdl1(url);
    if (!result || result.length === 0) {
        result = await igdl2(url);
    }
    if (!result || result.length === 0) {
        result = await igdl3(url);
    }
    if (!result || result.length === 0) {
        result = await igdl4(url);
    }
    if (!result || result.length === 0) {
        result = {
            message: "all server error"
        };
    }
    return result;
};

const Twitter = async (url) => {
    let result = await twdl3(url);
    if (!result || result.length === 0) {
        result = await twdl2(url);
    }
    if (!result || result.length === 0) {
        result = await twdl1(url);
    }
    if (!result || result.length === 0) {
        result = {
            message: "all server error"
        };
    }
    return result;
};

app.get('/igdl', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) return res.status(400).json({ error: 'Parameter url is required' });
        if (!/https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)/.test(url)) return res.status(400).json({ error: "Example: https://www.instagram.com/p/Cz1fTwMJFpx/?igsh=MXRrY2g4eWNucGoyZg==" });
        let result = await getInstagramDownloadLinks(url);
        let result_upload = {
            media: []
        }

        for (let item of result) {
            let unduh = await DownloadFile(item);
            result_upload.media.push({
                type: unduh.mimeType,
                path: unduh.filePath,
                url_path: `https://downloader-nex.vercel.app/temp/${path.basename(unduh.filePath)}`
            });
        }

        res.json(result_upload);

        for (let item of result_upload.media) {
            try {
                await new Promise(resolve => setTimeout(resolve, 10 * 60 * 1000)); // 10 minutes
                await fss.unlink(item.path);
                console.log(`File ${item.path} deleted.`);
            } catch (error) {
                console.error(`Error deleting file ${item.path}:`, error);
            }
        }
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({
            error: 'Failed to process request\n' + error
        });
    }
});

app.get('/twdl', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) return res.status(400).json({ error: 'Parameter url is required' });
        let result = await Twitter(url);
        
        let result_upload = {
            media: []
        }

        for (let item of result) {
            let unduh = await DownloadFile(item);
            result_upload.media.push({
                type: unduh.mimeType,
                path: unduh.filePath,
                url_path: `https://downloader-nex.vercel.app/temp/${path.basename(unduh.filePath)}`,
                url_path2: `http://${os.hostname()}:${PORT}/temp/${path.basename(unduh.filePath)}`
            });
        }

        res.json(result_upload);

        for (let item of result_upload.media) {
            try {
                await new Promise(resolve => setTimeout(resolve, 10 * 60 * 1000)); // 10 minutes
                await fss.unlink(item.path);
                console.log(`File ${item.path} deleted.`);
            } catch (error) {
                console.error(`Error deleting file ${item.path}:`, error);
            }
        }
        
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({
            error: 'Failed to process request\n' + error
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port https://localhost:${PORT}`);
});
