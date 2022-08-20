import { Actor, RequestQueue } from 'apify'
import { profile } from 'console'
import {
  CheerioCrawler,
  downloadListOfUrls,
  enqueueLinks,
  log,
  LogLevel,
  PuppeteerCrawler,
  RequestList,
} from 'crawlee'
const _ = require('lodash')

async function Apify() {
  // Crawlers come with various utilities, e.g. for logging.
  // Here we use debug level of logging to improve the debugging experience.
  // This functionality is optional!
  log.setLevel(LogLevel.DEBUG)

  const listOfUrls = await downloadListOfUrls({
    url: 'https://fatalmodel.com/shared/sitemap-ad-0.xml',
    // regex for https://fatalmodel.com/868371/patricia-morgana-868371
    urlRegExp: /https:\/\/fatalmodel.com\/(\d+)\/[^\/]+[\w\w]+/gi,
  })
  console.log('listOfUrls', listOfUrls)
  // Open the default request queue associated with the actor run
  const requestList = await RequestList.open(
    'primeiro_dataset',
    listOfUrls.map((url) => ({ url })),
  )

  // Create an instance of the CheerioCrawler class - a crawler
  // that automatically loads the URLs and parses their HTML using the cheerio library.
  const crawler = new CheerioCrawler({
    // The crawler downloads and processes the web pages in parallel, with a concurrency
    // automatically managed based on the available system memory and CPU (see AutoscaledPool class).
    // Here we define some hard limits for the concurrency.
    minConcurrency: 10,
    maxConcurrency: 20,

    // On error, retry each page at most once.
    maxRequestRetries: 1,

    maxRequestsPerCrawl: 1,

    // Increase the timeout for processing of each page.
    requestHandlerTimeoutSecs: 30,

    // This function will be called for each URL to crawl.
    // It accepts a single parameter, which is an object with options as:
    // https://sdk.apify.com/docs/typedefs/cheerio-crawler-options#handlepagefunction
    // We use for demonstration only 2 of them:
    // - request: an instance of the Request class with information such as URL and HTTP method
    // - $: the cheerio object containing parsed HTML
    requestList,

    async requestHandler({ request, $ }) {
      const contact_raw = $('contact').attr(':profile-information')
      const contact = JSON.parse(contact_raw)

      const filtered_data = {
        title: contact.title || '',
        whatsapp: contact.phone_number_whatsapp || '',
        status_phrase: contact.status_phrase || '',
        description: contact.description || '',
        profile_url: contact.profile_url || '',
        created_month: contact.created_month || '',
        last_seen: contact?.variable?.last_seen?.message || '',
        city: contact?.profile?.city?.title || '',
        state: contact?.profile?.city?.state?.title || '',
        sexo: contact?.profile?.sex?.description || '',
      }

      await Actor.pushData(filtered_data)
    },

    // This function is called if the page processing failed more than maxRequestRetries+1 times.
    failedRequestHandler({ request }) {
      log.debug(`Request ${request.url} failed twice.`)
    },
  })

  // Run the crawler and wait for it to finish.
  await crawler.run()

  log.debug('Crawler finished.')
}

Apify()
