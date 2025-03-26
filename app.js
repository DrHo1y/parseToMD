const TurndownService = require('turndown')
const { JSDOM } = require('jsdom')
const rp = require('request-promise')
const fs = require('node:fs')
async function parseHTML(urls, tagName) {
    try {
        const len = urls.length
        for (let i = 0; i < len; i++) {

            const html = await rp(urls[i])

            const dom = new JSDOM(html)
            const document = dom.window.document
            const name = document.getElementsByClassName('tm-title tm-title_h1')
                .item(0).textContent.replace(new RegExp('[|*?<>:\\\n\r\t\v]', 'gm'), '')
            const res = document.getElementsByTagName(tagName).item(0).outerHTML

            const turndownService = new TurndownService()
            const markdown = turndownService.turndown(res)
            const filename = `content1/${i+1}-${name}.md`
            fs.writeFile(filename, markdown, err => {
                if (err) {
                    console.error(err)
                } else {
                    // console.log(`File save as ${filename}`)
                }
            })
            console.log('Parse html to md: ' + (i+1) + '/' + len)
        }
    } catch (e) {
        console.error(e)
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
        console.log(e)
    }
}

async function main() {
    const query = 'div.tm-article-snippet.tm-article-snippet > h2 > a'
    var masURL = []

    for (let i = 1; i < 47 + 1; i++)
    {
        let urlsT = await pasreArticlesURL(`https://habr.com/ru/hubs/DIY/articles/page${i}/`, query)
        masURL.push(urlsT)
        console.log(`Parse urls ${i}/47 pages`)
    }
    masURL = masURL.flat()
    var time = Date.now()
    await parseHTML(masURL, 'article').then(() => {
        time = (Date.now() - time) / 1000
        console.log(`Complite! ${time}s`)
    })
}

main()