import axios from 'axios';
import cheerio from 'cheerio';
import { createRequire } from 'module';
import os from 'os';
import express from 'express';
import { promisify } from 'util';
import { fileTypeFromBuffer } from 'file-type';
import ffmpeg from 'fluent-ffmpeg';
import nodeID3 from 'node-id3';
import ytdl from 'ytdl-core';
import FormData from 'form-data';
const require = createRequire(import.meta.url);
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const PORT = process.env.PORT || 5000;
const app = express();
const readFileAsync = promisify(fs.readFile);
import fetch from 'node-fetch';

const tempDir = path.join(os.tmpdir(), "temp");
const fss = fs.promises;

(async () => {
    if (!fs.existsSync(tempDir)) {
        await fss.mkdir(tempDir, { recursive: true });
    }
})();

const youtube = google.youtube({ version: 'v3', auth: 'AIzaSyBPkpdJEGtAHebbaP3_CcA1_urfMFfeLLg' });

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

async function DownloadFile(url) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const mimeType = response.headers['content-type'];
        const buffer = response.data;
        const fileExtension = (await fileTypeFromBuffer(buffer)).ext;
        const filename = `downloaded_file_${Date.now()}.${fileExtension}`;
        const filePath = path.join(tempDir, filename);
        await fss.writeFile(filePath, buffer);
        console.log(`File berhasil diunduh dan disimpan sebagai: ${filePath}`);
        return { mimeType, filePath };
    } catch (error) {
        console.error('Error saat mengunduh file:', error);
        return null;
    }
}



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

/****
YTMP3
YTMP3
YTMP3
YTMP3
*****/
async function uploader(buffer) {
    const { ext } = await fileTypeFromBuffer(buffer);
    const bodyForm = new FormData();
    bodyForm.append('file', buffer, `file.${ext}`);

    const response = await fetch('https://aemt.me/api/upload.php', {
        method: 'POST',
        body: bodyForm,
    });

    return {
        status: response.status,
        creator: 'Nex',
        result: await response.json(),
    };
}

async function getHDThumbnailUrl(videoId) {
    try {
        const response = await youtube.videos.list({ part: 'snippet', id: videoId });
        return response.data.items[0].snippet.thumbnails.maxres.url;
    } catch (error) {
        console.error('Error fetching HD thumbnail URL:', error.message);
        return null;
    }
}

async function GetId(data) {
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtu(?:be\.com\/(?:watch\?(?:v=|vi=)|v\/|vi\/)|\.be\/|be\.com\/embed\/|be\.com\/shorts\/)|youtube\.com\/\?(?:v=|vi=))([\w-]{11})/;
    const res = regex.exec(data);
    if (res && res[1]) return res[1];
    throw new Error("Please check the URL you have entered");
}

async function addAudioTags(media, title, artist, year, imagecover) {
    try {
        let audioBuffer = (typeof media === 'string') ? Buffer.from((await axios.get(media, { responseType: 'arraybuffer', maxContentLength: -1 })).data) : (media instanceof Buffer) ? media : (() => { throw new Error('Media harus berupa URL string atau Buffer.'); })();
        const randomFilename = title.replace(/[^\w\s\#\$\&\-\+\(\)\/\[\]\`\×\{\}\\\\\~\•]/g, '') + '.mp3';
        const tmpFilePath = path.join(tempDir, randomFilename);
        fs.writeFileSync(tmpFilePath, audioBuffer);
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
}

function generateRandomName(length) {
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomName = '';
    for (let i = 0; i < length; i++) {
        randomName += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return randomName;
}

async function getAudioMP3Url(videoUrl) {
    try {
        const info = await ytdl.getInfo(videoUrl);
        const audioFormat = ytdl.chooseFormat(info.formats, { filter: 'audioonly', quality: 'highestaudio' });
        const path_audio = path.join(tempDir, generateRandomName(10) + '.mp3');
        let uploadResult;
        await new Promise((resolve, reject) => {
            ffmpeg()
                .input(audioFormat.url)
                .outputOptions('-f mp3')
                .outputOptions('-acodec libmp3lame')
                .outputOptions('-ab 128k')
                .outputOptions('-ar 44100')
                .on('end', async () => {
                    const buffer = fs.readFileSync(path_audio);
                    const id_video = await GetId(videoUrl);
                    const hd_thumbnail = await getHDThumbnailUrl(id_video);
                    const convert = await addAudioTags(buffer, info.videoDetails.title, info.videoDetails.ownerChannelName, 2024, hd_thumbnail);
                    const buffer2 = fs.readFileSync(convert.path);
                    uploadResult = await uploader(buffer2);
                    console.log('Upload result:', uploadResult);
                    fs.unlinkSync(path_audio);
                    fs.unlinkSync(convert.path);
                    resolve(uploadResult);
                })
                .on('error', (err) => {
                    console.error('FFmpeg conversion error:', err);
                    reject(err);
                })
                .save(path_audio);
        });
        return uploadResult;
    } catch (error) {
        console.error('Error:', error);
        throw new Error('Failed to process audio URL');
    }
}

app.get('/ytmp3', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) return res.status(400).json({ error: 'Parameter url is required' });
        let result = await getAudioMP3Url(url);
        res.json(result);
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({
            error: 'Failed to process request\n' + error
        });
    }
});

const urlRegex44 = /^(https?:\/\/)(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$/;

function getRandomUserAgent() {
    const userAgents = [
        'Mozilla/5.0 (Linux; Android 12; SM-G991B Build/SP1A.210812.016; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/99.0.4844.88 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/363.0.0.30.112;]',
        'Mozilla/5.0 (Linux; Android 11; SM-G986N Build/RP1A.200720.012; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/80.0.3987.163 Whale/1.0.0.0 Crosswalk/25.80.14.21 Mobile Safari/537.36 NAVER(inapp; search; 730; 10.32.5)',
        'Mozilla/5.0 (Linux; Android 12; SM-G998B Build/SP1A.210812.016; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/102.0.5005.125 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/372.1.0.23.107;]',
        'Mozilla/5.0 (Linux; Android 12; Galaxy S21+) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.5615.100 Mobile Safari/537.36 WhatsApp/1.2.3',
        'Mozilla/5.0 (Linux; Android 13; SM-S918W Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/111.0.5563.67 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/405.0.0.23.72;]',
        'Mozilla/5.0 (Linux; Android 9; SM-A730F) AppleWebKit/537.36 (KHTML, like Gecko) coc_coc_browser/87.0.162 Mobile Chrome/81.0.4044.162 Mobile Safari/537.36 WhatsApp/1.2.3',
        'Mozilla/5.0 (Linux; Android 11; SM-M215G Build/RP1A.200720.012; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/98.0.4758.101 Mobile Safari/537.36 GSA/13.5.13.23.arm64',
        'Mozilla/5.0 (Linux; Android 13; SM-M146B Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/114.0.5735.196 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/421.0.0.33.47;]',
        'Mozilla/5.0 (Linux; Android 13; 2201123G Build/TKQ1.220807.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/114.0.5735.61 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/418.0.0.33.69;]',
        'Mozilla/5.0 (Linux; Android 12; 22081212UG Build/SKQ1.220303.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/110.0.5481.153 Mobile Safari/537.36 [FB_IAB/Orca-Android;FBAV/400.0.0.11.90;]',
        'Mozilla/5.0 (Linux; U; Android 13; zh-cn; 2203121C Build/TKQ1.220829.002) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/100.0.4896.127 Mobile Safari/537.36 XiaoMi/MiuiBrowser/17.5.120328 swan-mibrowser',
        'Mozilla/5.0 (Linux; U; Android 14; zh-cn; 2206122SC Build/UKQ1.231003.002) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/109.0.5414.118 Mobile Safari/537.36 XiaoMi/MiuiBrowser/18.2.150419',
        'Mozilla/5.0 (Linux; Android 13; 2304FPN6DC Build/TKQ1.221114.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/118.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/438.0.0.33.118;]',
        'Mozilla/5.0 (Linux; U; Android 14; zh-CN; 24053PY09C Build/UKQ1.240116.001) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/100.0.4896.58 Quark/7.0.0.590 Mobile Safari/537.36',
        'Mozilla/5.0 (Linux; U; Android 12; zh-CN; M2007J1SC Build/SKQ1.211006.001) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/78.0.3904.108 Quark/5.8.2.221 Mobile Safari/537.36',
        'Mozilla/5.0 (Linux; Android 10; Redmi K30S) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.96 Mobile Safari/537.36 EdgA/88.0.705.53',
        'Mozilla/5.0 (Linux; U; Android 12; zh-cn; 22041211AC Build/SP1A.210812.016) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/98.0.4758.102 MQQBrowser/13.5 Mobile Safari/537.36 COVC/046333',
        'Mozilla/5.0 (Linux; Android 13; 23078RKD5C Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/89.0.4389.72 MQQBrowser/6.2 TBS/046279 Mobile Safari/537.36 StApp/m6/2.6.5/android',
        'Mozilla/5.0 (Linux; Android 11; 21091116AI Build/RP1A.200720.011; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/102.0.5005.78 Mobile Safari/537.36 GSA/13.21.16.26.arm64',
        'Mozilla/5.0 (Linux; Android 12; 21091116I Build/SP1A.210812.016; ) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/109.0.0.0 Mobile Safari/537.36 BingSapphire/25.3.410526302',
        'Mozilla/5.0 (Linux; Android 11; 21091116AI Build/RP1A.200720.011; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/103.0.5060.129 Mobile Safari/537.36 WpsMoffice/16.4/arm64-v8a/1331',
        'Mozilla/5.0 (Linux; Android 12; 21091116I Build/SP1A.210812.016; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/105.0.5195.136 Mobile Safari/537.36 [FB_IAB/Orca-Android;FBAV/378.0.0.25.106;]',
        'Mozilla/5.0 (Linux; Android 11; 21091116AI Build/RP1A.200720.011; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/101.0.4951.61 Mobile Safari/537.36 GoogleApp/13.18.7.23.arm64',
        'Mozilla/5.0 (Linux; Android 14; Pixel Fold Build/UQ1A.231205.015.A1; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.6099.193 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/445.0.0.34.118;]',
        'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro Build/UD1A.231105.004; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/119.0.6045.193 Mobile Safari/537.36 Brave/1.62.162',
        'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro Build/UD1A.230803.041; en-us) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.66 Mobile Safari/537.36 Puffin/10.0.0.51608AP',
        'Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/UD1A.230803.022.A5; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/114.0.5735.61 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/441.1.0.39.109;]',
        'Mozilla/5.0 (Linux; Android 11; Pixel 4a (5G) Build/RQ3A.210805.001.A1; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/92.0.4515.166 Mobile Safari/537.36 GoogleApp/12.34.17.29.arm64',
        'Mozilla/5.0 (Linux; Android 14; Infinix X6871 Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/126.0.6478.47 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/468.1.0.56.78;]',
        'Mozilla/5.0 (Linux; Android 13; Infinix X6739 Build/TP1A.220624.014; en-us) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.66 Mobile Safari/537.36 Puffin/10.1.0.51631AP',
        'Mozilla/5.0 (Linux; Android 13; Infinix X6711 Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/108.0.5359.128 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/441.0.0.32.109;]',
        'Mozilla/5.0 (Linux; Android 13; Infinix X6710 Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/114.0.5735.60 Mobile Safari/537.36 YandexSearch/7.53 YandexSearchBrowser/7.53',
        'Mozilla/5.0 (Linux; Android 13; Infinix X6832 Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/123.0.6312.40 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/454.1.0.49.104;]',
        'Mozilla/5.0 (Linux; Android 12; Infinix X6820 Build/SP1A.210812.016; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/112.0.5615.101 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/411.1.0.29.112;]'
    ];

    const randomIndex = Math.floor(Math.random() * userAgents.length);
    return userAgents[randomIndex];
}

const generateRandomIP = () => {
  const octet = () => Math.floor(Math.random() * 256);
  return `${octet()}.${octet()}.${octet()}.${octet()}`;
};


app.get('/fetch', async (req, res) => {
  const { url } = req.query;
  // Validasi URL dengan regex
  if (!urlRegex44.test(url)) {
    return res.status(400).send('URL tidak valid');
  }
  try {
    // Lakukan fetch web dengan Axios
    const response = await axios.get(url, {
      headers: {
        'User-Agent': getRandomUserAgent() || 'Mozilla/5.0 (Linux; Android 6.0.1; SM-N916S Build/MMB29K; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/106.0.5249.126 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/389.0.0.42.111;]',
        'Referer': 'https://komiku.id/devious-son-of-heaven-chapter-04/',
        'X-Forwarded-For': generateRandomIP()
      }
    });
    // Cek status response
    if (response.status !== 200) {
      return res.status(response.status).send('Terjadi kesalahan saat mengambil data');
    }
    // Kembalikan data dari Axios
    res.send(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).send('Terjadi error saat melakukan fetch web');
  }
});


app.listen(PORT, () => {
    console.log(`Server is running on port https://localhost:${PORT}`);
});
