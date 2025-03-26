const { Worker, isMainThread, parentPort, workerData } = require('node:worker_threads')
const TurndownService = require('turndown')
const { JSDOM } = require('jsdom')
const rp = require('request-promise')
const fs = require('node:fs')

async function parseHTML(obj, tagName) {
    try {
        const url = obj.url
        const index = obj.index
        const html = await rp(url)
        const dom = new JSDOM(html)
        const document = dom.window.document
        const name = document.getElementsByClassName('tm-title tm-title_h1')
            .item(0).textContent
            .replace(new RegExp('[\\/:*?"<>|\n\r\t\v]', 'gm'), '')
            .replace(new RegExp('/\.$/]', 'gm'), '')
            .trim()
        const res = document.getElementsByTagName(tagName).item(0).outerHTML

        const turndownService = new TurndownService()
        const markdown = turndownService.turndown(res)
        const filename = `content1/${index}-${name}.md`
        fs.writeFile(filename, markdown, err => {
            if (err) {
                console.error(err)
            } else {
            }
        })
        return { url, status: 'ok' }
    } catch (e) {
        let url = obj.url
        return { url, status: 'error' }
    }
}

async function pasreArticlesURL(url, query) {
    try {
        const html = await rp(url)
        const dom = new JSDOM(html)

        const document = dom.window.document
        var urls = document.querySelectorAll(query)
        var resURLS = []
        var urlHttps = 'https://' + url.split('/')[2]
        urls.forEach(url => {
            let res = urlHttps + url.href
            resURLS.push(res)
        })
        return resURLS
    } catch (e) {
        console.log('error')
    }
}

async function parseURLsAndSave() {
    const query = 'div.tm-article-snippet.tm-article-snippet > h2 > a'
    var masURL = []

    for (let i = 1; i < count + 1; i++) {
        let urlsT = await pasreArticlesURL(`https://habr.com/ru/hubs/DIY/articles/page${i}/`, query)
        masURL.push(urlsT)
        console.log(`Parse urls ${i}/47 pages`)
    }
    masURL = masURL.flat()
    fs.writeFile('urls.json', JSON.stringify(masURL), err => {
        if (err) {
            console.error(err)
        } else {
        }
    })
}

function chunkArray(array, size) {
    const chunks = []
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size))
    }
    return chunks
}

// async function main(count) {
//     var time = Date.now()


//     const jsonURL = JSON.parse(fs.readFileSync('urls.json', 'utf-8'))

//     await parseHTML(jsonURL, 'article').then(() => {
//         time = (Date.now() - time) / 1000 / 60
//         console.log(`Complite! ${time}m`)
//     })
// }

// main(47)


// Основной процесс (главный поток)
if (isMainThread) {
    const urls1 = JSON.parse(fs.readFileSync('urls.json', 'utf-8'))
    const urls = []
    urls1.map((el, key) => urls.push({ url: el, index: key + 1 }))
    const numWorkers = 20 // Количество рабочих потоков

    console.log(`Запускаем ${urls.length} запросов с использованием ${numWorkers} потоков...`)

    let completedRequests = 0
    const results = []

    // Разделяем массив ссылок на части для каждого потока
    const chunkedUrls = chunkArray(urls, Math.ceil(urls.length / numWorkers))

    // Функция для создания рабочих потоков
    function createWorker(workerUrls) {
        return new Promise((resolve, reject) => {
            const worker = new Worker(__filename, {
                workerData: { urls: workerUrls }
            })

            worker.on('message', (message) => {
                results.push(...message)
                completedRequests++
                if (completedRequests === numWorkers) {
                    console.log('Все запросы завершены.')
                    fs.writeFileSync('result.json', JSON.stringify(results), err => {
                        if (err) {
                            console.error(err)
                        } else {
                        }
                    })
                    resolve()
                }
            })

            worker.on('error', reject)
            worker.on('exit', (code) => {
                if (code !== 0) {
                    reject(new Error(`Worker stopped with exit code ${code}`))
                }
            })
        })
    }

    // Запускаем рабочие потоки
    const workers = chunkedUrls.map((chunk) => createWorker(chunk))
    Promise.all(workers).then(() => {
        console.log('Программа завершена.')
    }).catch((err) => {
        console.error('Ошибка:', err)
    })
} else {
    // Рабочий поток
    var { urls } = workerData;
    (async () => {
        const responses = []
        for (const url of urls) {
            const result = await parseHTML(url, 'article')
            responses.push(result)
        }
        parentPort.postMessage(responses)
    })()
}
