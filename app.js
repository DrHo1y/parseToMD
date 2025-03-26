const TurndownService = require('turndown')
const { JSDOM } = require('jsdom')
const rp = require('request-promise')
const fs = require('node:fs')

async function parseHTML(urls, _class) {
    try {
        const len = urls.length
        for (let i = 0; i < len; i++) {
            const html = await rp(urls[i])

            const dom = new JSDOM(html)
            const document = dom.window.document
            const name = document.getElementsByClassName('tm-title tm-title_h1').item(0).textContent.replace(new RegExp('[|*?<>:\\\n\r\t\v]', 'gm'), '')
            const res = document.getElementsByTagName(_class).item(0).outerHTML

            const turndownService = new TurndownService()
            const markdown = turndownService.turndown(res)
            const filename = `content/${i+1}-${name}.md`
            fs.writeFile(filename, markdown, err => {
                if (err) {
                    console.error(err)
                } else {
                    console.log(`File save as ${filename}`)
                }
            })
        }

    } catch (e) {
        console.error(e)
    }
}

const urls = [
    'https://habr.com/ru/companies/selectel/articles/893268/',
    'https://habr.com/ru/articles/892860/',
    'https://habr.com/ru/companies/ru_mts/articles/888756/',
    'https://habr.com/ru/companies/timeweb/articles/885626/',
    'https://habr.com/ru/articles/887956/',
    'https://habr.com/ru/companies/ru_mts/articles/887368/',
    'https://habr.com/ru/companies/ru_mts/articles/887068/',
    'https://habr.com/ru/companies/otus/articles/884434/',
    'https://habr.com/ru/companies/tractorpilot/articles/880596/',
    'https://habr.com/ru/companies/ascon/articles/874490/'

]

parseHTML(urls, 'article')