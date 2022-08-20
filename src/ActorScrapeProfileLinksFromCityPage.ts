import { Actor, RequestQueue } from 'apify'
import { CheerioCrawler, enqueueLinks, log, LogLevel } from 'crawlee'

async function Apify() {
  // Crawlers come with various utilities, e.g. for logging.
  // Here we use debug level of logging to improve the debugging experience.
  // This functionality is optional!
  log.setLevel(LogLevel.DEBUG)

  // Open the default request queue associated with the actor run
  const requestQueue = await RequestQueue.open()
  // Enqueue the initial request
  await requestQueue.addRequests([
    {
      url: 'https://fatalmodel.com/acompanhantes-teresina-pi',
    },
    { url: 'https://fatalmodel.com/acompanhantes-sao-paulo-sp' },
  ])

  // Create an instance of the CheerioCrawler class - a crawler
  // that automatically loads the URLs and parses their HTML using the cheerio library.
  const crawler = new CheerioCrawler({
    // The crawler downloads and processes the web pages in parallel, with a concurrency
    // automatically managed based on the available system memory and CPU (see AutoscaledPool class).
    // Here we define some hard limits for the concurrency.
    minConcurrency: 10,
    maxConcurrency: 50,

    // On error, retry each page at most once.
    maxRequestRetries: 1,

    // Increase the timeout for processing of each page.
    requestHandlerTimeoutSecs: 30,

    // Limit to 10 requests per one crawl
    maxRequestsPerCrawl: 10,

    // This function will be called for each URL to crawl.
    // It accepts a single parameter, which is an object with options as:
    // https://sdk.apify.com/docs/typedefs/cheerio-crawler-options#handlepagefunction
    // We use for demonstration only 2 of them:
    // - request: an instance of the Request class with information such as URL and HTTP method
    // - $: the cheerio object containing parsed HTML
    requestQueue,

    async requestHandler({ request, $ }) {
      log.debug(`Processing ${request.url}...`)

      // Extract all profile links from the page using cheerio.
      const profile_links = $('.profile-link')
        .map((i, el) => $(el).attr('href'))
        .toArray()

      // Extract all profile links of premium users
      const premium_users_links = $('div.super-top-card > a')
        .map((i, el) => $(el).attr('href'))
        .toArray()

      // Store the results to the dataset. In local configuration,
      // the data will be stored as JSON files in ./storage/datasets/default
      await Actor.pushData({
        url: request.url,
        profile_links,
        premium_users_links,
      })

      const paginationUrls = $('ul.pagination a')
        .map((i, el) => $(el).attr('href'))
        .toArray()
        .map((pageUrl) => ({ url: pageUrl }))

      await requestQueue.addRequests(paginationUrls)
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
