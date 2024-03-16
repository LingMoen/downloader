import express from 'express';
import axios from 'axios';
import fs from 'fs';
import os from 'os';
import path from 'path';
import cheerio from 'cheerio';
const PORT = process.env.PORT || 3000;
const app = express();
import {
	createRequire
} from "module"
const require = createRequire(import.meta.url)
const {
	promisify
} = require('util');
const mm = require('music-metadata');
const id3 = require('node-id3');


const generateRandomIP = () => {
	const octet = () => Math.floor(Math.random() * 256);
	return `${octet()}.${octet()}.${octet()}.${octet()}`;
};

// Create temp directory if it doesn't exist
const readFileAsync = promisify(fs.readFile);
const tempDir = path.join(os.tmpdir(), "temp");
    if (!fs.existsSync(tempDir)) {
	fs.mkdirSync(tempDir, {
		recursive: true
	});
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
		const response = await axios.get(url, {
			responseType: 'arraybuffer',
			headers: {
				'User-Agent': 'Mozilla/5.0 (Linux; Android 11; M2004J19C Build/RP1A.200720.011) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.129 Mobile Safari/537.36 WhatsApp/1.2.3',
				'Referer': url,
				'X-Forwarded-For': generateRandomIP(),
			}
		});
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
		const response = await axios.get(url, {
			responseType: 'arraybuffer',
			headers: {
				'User-Agent': 'Mozilla/5.0 (Linux; Android 11; M2004J19C Build/RP1A.200720.011) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.129 Mobile Safari/537.36 WhatsApp/1.2.3',
				'Referer': url,
				'X-Forwarded-For': generateRandomIP(),
			}
		});
		const randomCode = Math.random().toString(36).substring(7);
		const videoPath = `downloaded_video_${randomCode}.mp4`;
		fs.writeFileSync(path.join(tempDir, "/" + videoPath), Buffer.from(response.data, 'binary'));
		return videoPath;
	} catch (error) {
		console.error('Error downloading video:', error.message);
		throw error;
	}
}



async function downloadFile2(url) {
    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 11; M2004J19C Build/RP1A.200720.011) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.129 Mobile Safari/537.36 WhatsApp/1.2.3',
                'Referer': url,
                'X-Forwarded-For': generateRandomIP(),
            }
        });
        const contentType = response.headers['content-type'];
        if (contentType.startsWith('image')) {
            const randomCode = Math.random().toString(36).substring(7);
            const imagePath = `downloaded_image_${randomCode}.png`;
            fs.writeFileSync(path.join(tempDir, "/" + imagePath), Buffer.from(response.data));
            return {type: "image", path: imagePath};
        } else if (contentType.startsWith('video')) {
            const randomCode = Math.random().toString(36).substring(7);
            const videoPath = `downloaded_video_${randomCode}.mp4`;
            fs.writeFileSync(path.join(tempDir, "/" + videoPath), Buffer.from(response.data));
            return {type: "video", path: videoPath};
        } else {
            console.error('Unsupported content type:', contentType);
            return null; // Atau throw error sesuai kebutuhan
        }
    } catch (error) {
        console.error('Error downloading file:', error.message);
        throw error;
    }
}


async function checkFileTypeAndMimeType(url) {
	try {
		const response = await axios.get(url);
		const contentType = response.headers['content-type'];
		return contentType
	} catch (error) {
		throw new Error('Failed to fetch headers: ' + error);
	}
}



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

async function addAudioMetadataFromUrl(audioUrl, title, artist, coverUrl) {
    try {
        // Download audio file
        const audioResponse = await axios.get(audioUrl, { responseType: 'arraybuffer' });
        const contentType = audioResponse.headers['content-type'];
        const audioBuffer = Buffer.from(audioResponse.data, 'binary');
        const randomCode = Math.random().toString(36).substring(7);
        const audioPath = path.join(tempDir, `downloaded_audio_${randomCode}.mp3`);
        fs.writeFileSync(audioPath, audioBuffer, 'binary');

        // Download cover image
        const coverResponse = await axios.get(coverUrl, { responseType: 'arraybuffer' });
        const coverBuffer = Buffer.from(coverResponse.data, 'binary');

        // Definisikan output path
        //const outputPath = path.join(tempDir, `${Date.now()}_${filename}.mp3`);

        // Add metadata
        const tags = {
            title: title,
            artist: artist,
            image: {
                mime: 'image/jpeg',
                type: { id: 3, name: 'front cover' },
                description: 'Cover (front)',
                imageBuffer: coverBuffer
            }
        };

        // Write metadata to audio file
        id3.write(tags, audioPath, (err) => {
            if (err) {
                console.error('Error writing metadata:', err);
                return;
            }
            console.log('Metadata added successfully.');
        });

        return { path: audioPath, mimetype: contentType };
    } catch (error) {
        console.error('Error adding metadata:', error);
    }
}


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


/*===============================================================
end of IGDL || end of IGDL || end of IGDL || end of IGDL || end of IGDL || end of IGDL
end of IGDL || end of IGDL || end of IGDL || end of IGDL || end of IGDL || end of IGDL
end of IGDL || end of IGDL || end of IGDL || end of IGDL || end of IGDL || end of IGDL
================================================================*/

/*===================================================================
TWITTER DL || TWITTER DL || TWITTER DL || TWITTER DL || TWITTER DL || TWITTER DL 
TWITTER DL || TWITTER DL || TWITTER DL || TWITTER DL || TWITTER DL || TWITTER DL 
TWITTER DL || TWITTER DL || TWITTER DL || TWITTER DL || TWITTER DL || TWITTER DL 
TWITTER DL || TWITTER DL || TWITTER DL || TWITTER DL || TWITTER DL || TWITTER DL 
====================================================================*/

async function TwitterV1(url) {
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

		$('.tw-video').each((index, element) => {
			const $dlAction = $(element).find('.dl-action');
			if (index === 0) {
				// Hanya sisakan elemen pertama
				$dlAction.find('p').eq(1).remove(); // Hapus elemen kedua di dalam '.dl-action'
				$dlAction.find('p').eq(2).remove(); // Hapus elemen ketiga di dalam '.dl-action'
			} else {
				// Hapus semua elemen kecuali yang pertama
				$dlAction.find('p').slice(1).remove();
			}
		});

		const $c = cheerio.load($.html())

		const hrefs = [];
		$c('a').each((index, element) => {
			hrefs.push($(element).attr('href'));
		});

		return hrefs

	} catch (error) {
		throw new Error('Failed to fetch Twitter image: ' + error);
	}
}

async function TwitterV2(url) {
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

		$('.tw-video').each((index, element) => {
			const $dlAction = $(element).find('.dl-action');
			if (index === 0) {
				// Hanya sisakan elemen pertama
				$dlAction.find('p').eq(1).remove(); // Hapus elemen kedua di dalam '.dl-action'
				$dlAction.find('p').eq(2).remove(); // Hapus elemen ketiga di dalam '.dl-action'
			} else {
				// Hapus semua elemen kecuali yang pertama
				$dlAction.find('p').slice(1).remove();
			}
		});

		const $c = cheerio.load($.html())

		const hrefs = [];
		$c('a').each((index, element) => {
			hrefs.push($(element).attr('href'));
		});

		return hrefs

	} catch (error) {
		throw new Error('Failed to fetch Twitter image: ' + error);
	}
}


async function TwitterV3(url) {
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
			return {
				link: link
			};
		}).get();
		// Menunggu semua promise selesai dan mengumpulkan hasilnya
		return Promise.all(promises);
	} catch (error) {
		throw new Error('Failed to fetch Twitter image: ' + error);
	}
}

const Twitter = async (url) => {
    try {
        let result = await TwitterV1(url);
        return result;
    } catch (error1) {
        try {
            let result = await TwitterV2(url);
            return result;
        } catch (error2) {
            try {
                let result = await TwitterV3(url);
                return result;
            } catch (error3) {
                return { message: "all server error" };
            }
        }
    }
};


/*========================================================================================
end of Twitter DL || end of Twitter DL || end of Twitter DL || end of Twitter DL || end of Twitter DL || end of Twitter DL
end of Twitter DL || end of Twitter DL || end of Twitter DL || end of Twitter DL || end of Twitter DL || end of Twitter DL
end of Twitter DL || end of Twitter DL || end of Twitter DL || end of Twitter DL || end of Twitter DL || end of Twitter DL
=========================================================================================*/

app.get('/add-metadata', async (req, res) => {
	let url = req.query.url || "https://github.com/LingMoen/COLAB/raw/main/Red%20Zone%20%5BFull%20Version%5D.mp3";
	let title = req.query.title || "Lappland";
	let artist = req.query.artist || "Nex";
	let imgUrl = req.query.imgUrl || "https://raw.githubusercontent.com/LingMoen/COLAB/main/wife-cover.jpg";
	try {
		const filePath = await addAudioMetadataFromUrl(url, title, artist, imgUrl);
		let amu = {
			...filePath, // tambahkan tanda koma di sini
			url: `https://downloader-nex.vercel.app/temp/${path.basename(filePath.path)}`
		}
		res.json(amu);
	} catch (error) {
		res.status(500).send(`Error: ${error}`);
	}
});


app.get('/igdl', async (req, res) => {
	try {
		const {
			url
		} = req.query;
		if (!url) {
			return res.status(400).json({
				error: 'Parameter url is required'
			});
		}
		if (!/https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)/.test(url)) {
			return res.status(400).json({
				error: "Example: https://www.instagram.com/p/Cz1fTwMJFpx/?igsh=MXRrY2g4eWNucGoyZg=="
			});
		}
		let result = await getInstagramDownloadLinks(url);
		let result_upload = {
			title: result?.title || 'untitled',
			media: []
		}

		for (let item of result.urls) {
			if (item.type === "image") {
				let unduh = await downloadImage(item.url);
				result_upload.media.push({
					type: item.type,
					path: unduh,
					url_path: `https://downloader-nex.vercel.app/temp/${path.basename(unduh)}`
				});
			} else if (item.type === "video") {
				let unduh = await downloadVideo(item.url);
				result_upload.media.push({
					type: item.type,
					path: unduh,
					url_path: `https://downloader-nex.vercel.app/temp/${path.basename(unduh)}`
				});
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
		res.status(500).json({
			error: 'Failed to process request\n' + error
		});
	}
});

app.get('/twdl', async (req, res) => {
	try {
		const {
			url
		} = req.query;
		if (!url) {
			return res.status(400).json({
				error: 'Parameter url is required'
			});
		}
		if (!/https?:\/\/(www\.)?(twitter|X)\.com\/.*\/status/.test(url)) {
			return res.status(400).json({
				error: "Example: https://twitter.com/LingMO315255/status/1759088250285867207?t=VV44DY4orFLXH2yTfRFW2A&s=19"
			});
		}
		let result = await Twitter(url);
		let result_upload = {
			media: []
		}

		for (let item of result) {
			let unduh = await downloadFile2(item)
			result_upload.media.push({
					type: unduh.type,
					path: unduh.path,
					url_path: `https://downloader-nex.vercel.app/temp/${path.basename(unduh.path)}`
				});
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
		res.status(500).json({
			error: 'Failed to process request\n' + error
		});
	}
});


const hostname = `https://downloader-nex.vercel.app`; // Ganti dengan host yang sesuai
app.listen(PORT, () => {
	console.log(`Server is running on http://${hostname}:${PORT}`);
});