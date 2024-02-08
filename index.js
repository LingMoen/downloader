import express from 'express';
import axios from 'axios';
import fs from 'fs';
import os from 'os';
import path from 'path';
import cheerio from 'cheerio';
const PORT = process.env.PORT || 3000;
const app = express();

const tempDir = path.join(os.tmpdir(), "temp");

// Create temp directory if it doesn't exist
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}
app.use('/temp', express.static(tempDir));
app.use(express.json());

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

async function downloadImage(url) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const randomCode = Math.random().toString(36).substring(7);
    const imagePath = `downloaded_image_${randomCode}.png`;
    fs.writeFileSync(path.join(tempDir, "/" + imagePath), Buffer.from(response.data, 'binary'));
    return imagePath;
  } catch (error) {
    console.error('Error downloading image:', error.message);
    throw error;
  }
}

async function downloadVideo(url) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const randomCode = Math.random().toString(36).substring(7);
    const videoPath = `downloaded_video_${randomCode}.mp4`;
    fs.writeFileSync(path.join(tempDir, "/" + videoPath), Buffer.from(response.data, 'binary'));
    return videoPath;
  } catch (error) {
    console.error('Error downloading video:', error.message);
    throw error;
  }
}

const generateRandomIP = () => {
	const octet = () => Math.floor(Math.random() * 256);
	return `${octet()}.${octet()}.${octet()}.${octet()}`;
};

const getMimeTypeFromUrl = async (url) => {
	try {
		const headers = {
			'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
			'Accept': '*/*',
			'User-Agent': 'Mozilla/5.0 (Linux; Android 12; SM-S908B Build/SP1A.210812.016; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/99.0.4844.58 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/357.0.0.23.115;]',
			'Referer': 'https://igdownloader.app/en',
			'X-Forwarded-For': generateRandomIP()
		};

		const response = await axios.head(url, {
			headers
		});
		const contentTypeHeader = response.headers['content-type'];
		const [mediaType] = contentTypeHeader.split('/');
		return mediaType;
	} catch (error) {
		console.error('Error while fetching media type:', error.message);
		return undefined;
	}
};

const checkMediaType = (url) => {
	const supportedImageExtensions = ['jpg', 'jpeg', 'png', 'webp', 'heic'];
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


/*
IGDL IGDL IGDL IGDL IGDL IGDL
IGDL IGDL IGDL IGDL IGDL IGDL
*/

async function igdl1(url) {
	try {
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
		const response = await axios.post(apiEndpoint, postData, requestOptions);
		const $ = cheerio.load(response.data.data);
		const downloadLinks = $('div.download-items__btn > a');
		const hrefArray = {
			title: null,
			urls: []
		}
		await Promise.all(downloadLinks.map(async (index, element) => {
			const href = $(element).attr('href');
			const media_type = await getMimeTypeFromUrl(href);
			let type;
			if (typeof media_type === 'undefined') {
				type = "video";
			} else {
				type = media_type;
			}
			hrefArray.urls.push({
				url: href,
				type: type
			});
		}));
		return hrefArray;
	} catch (error) {
		console.error('Instagram Downloader 1 - Error:', error.message);
		return null;
	}
}

async function igdl2(url) {
	const apiEndpoint = 'https://snapinst.com/api/convert';

	const requestData = {
		url,
		ts: Date.now(),
		_ts: Date.now() - 106169240745,
		_tsc: 0,
		_s: 'b4d95f81de50ed9cace0103923a25dd2f57b2a76c142d82ac78a963f1274a1e1',
	};

	const headers = {
		'Accept': 'application/json, text/plain, */*',
		'Content-Type': 'application/json',
		'X-XSRF-TOKEN': 'eyJpdiI6InZ3aU9SVG41enJWOUljS3hIUnpsd3c9PSIsInZhbHVlIjoiakFHQjcrVjNMQm1wZ2xrcmF6NGdOSjdTUFp0ZTNFNXpCZ0tcL3VaNmFaN09TSVl2QzFZVndTVmxLUFo2QVVuYnpcL2JDdVwvc29sdHB6XC9jSzY2aURYMDdzcmd4TWVHUjZzWHpHZXEySXJMb0UwN3dqbUFDRlZFTXFxU2E4U2hOUzg5IiwibWFjIjoiNGQyYjBjYWNhNGQwMWUwZWE4YWM1MzdkMWJlYmRkYzBkOTMyZDZjNWVhNjE3MzAxOWMwNTM2OTJiOTM0ZjMwNyJ9',
		'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
		'Referer': 'https://snapinst.com/',
	};

	try {
		const response = await axios.post(apiEndpoint, requestData, {
			headers
		});
		const resultArray = [];

		const transformedData = {
			title: response.data[0].meta.title,
			urls: response.data.map(item => item.url.map(urlInfo => ({
				url: urlInfo.url,
				type: checkMediaType(urlInfo.type)
			})))
		};

		return transformedData;
	} catch (error) {
		console.error('Instagram Downloader 2 - Error:', error.message);
		return null;
	}
}


async function igdl3(url) {
	const apiEndpoint = 'https://co.wuk.sh/api/json';

	const requestData = {
		url,
		aFormat: 'mp3',
		filenamePattern: 'classic',
		dubLang: false,
		vQuality: '720',
	};

	const headers = {
		'Accept': 'application/json',
		'Content-Type': 'application/json',
		'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
		'Referer': 'https://cobalt.tools/',
	};

	try {
		const response = await axios.post(apiEndpoint, requestData, {
			headers
		});
		var result = response.data;
		let array_res = {
			title: null,
			urls: []
		}
		if (result.status === "redirect") {
			let media_type = await getMimeTypeFromUrl(result.url)
			array_res.urls.push({
				url: result.url,
				type: media_type
			})
		} else if (result.status === "picker") {
			for (let i = 0; i < result.picker.length; i++) {
				let media_type = await getMimeTypeFromUrl(result.picker[i].url)
				array_res.urls.push({
					url: result.picker[i].url,
					type: media_type
				})
			}
		}
		return array_res;
	} catch (error) {
		console.error('Instagram Downloader 3 - Error:', error.message);
		return null;
	}
};

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
		const hrefArray = {
			title: null,
			urls: []
		}
		await Promise.all(downloadLinks.map(async (index, element) => {
			const href = $(element).attr('href');
			const media_type = await getMimeTypeFromUrl(href);
			let type;
			if (typeof media_type === 'undefined') {
				type = "video";
			} else {
				type = media_type;
			}
			hrefArray.urls.push({
				url: href,
				type: type
			});
		}));
		return hrefArray;
	} catch (error) {
		console.error('Instagram Downloader 4 - Error:', error.message);
		return null;
	}
}

const getInstagramDownloadLinks = async (url) => {
  let result = await igdl1(url);
  if (!result) {
    result = await igdl2(url);
  }
  if (!result) {
    result = await igdl3(url);
  }
  if (!result) {
    result = await igdl4(url);
  }
  if (!result) {
    result = {
      message: "all server error"
    };
  }
  return result;
};

app.get('/igdl', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: 'Parameter url is required' });
    }
    if (!/https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)/.test(url)) {
      return res.status(400).json({ error: "Example: https://www.instagram.com/p/Cz1fTwMJFpx/?igsh=MXRrY2g4eWNucGoyZg==" });
    }
    let result = await getInstagramDownloadLinks(url);
    let result_upload = { 
      title: result?.title || 'untitled',
      media: []
    }

    for (let item of result.urls) {
      if (item.type === "image") {
        let unduh = await downloadImage(item.url);
        result_upload.media.push({ type: item.type, path: unduh, url_path: `https://downloader-nex.vercel.app/temp/${path.basename(unduh)}` });
      } else if (item.type === "video") { 
        let unduh = await downloadVideo(item.url);
        result_upload.media.push({ type: item.type, path: unduh, url_path: `https://downloader-nex.vercel.app/temp/${path.basename(unduh)}` });
      }
    }
    
    res.json(result_upload);
    
    for (let item of result_upload.media) {
      try {
        await new Promise(resolve => setTimeout(resolve, 10 * 60 * 1000)); // 10 minutes
        await fs.unlink(item.path);
        console.log(`File ${item.path} deleted.`);
      } catch (error) {
        console.error(`Error deleting file ${item.path}:`, error);
      }
    }
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'Failed to process request\n' + error});
  }
});


const hostname = `https://downloader-nex.vercel.app`;  // Ganti dengan host yang sesuai
app.listen(PORT, () => {
  console.log(`Server is running on http://${hostname}:${PORT}`);
});
