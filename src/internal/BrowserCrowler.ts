import { Browser, Page } from 'puppeteer'
import puppeteer from 'puppeteer-extra'
import stealthPlugin from 'puppeteer-extra-plugin-stealth'

puppeteer.use(stealthPlugin())
export class BrowserCrowler {
  _browser: Browser | null = null
  _page: Page | null = null
  _browserSettings = {}
  pptr_instance_url = ''

  constructor(browserSettings = {}) {
    const defaults = {
      headless: true,
      ignoreHTTPSErrors: true,
      args: [
        '--incognito',
        '--autoplay-policy=user-gesture-required', // https://source.chromium.org/search?q=lang:cpp+symbol:kAutoplayPolicy&ss=chromium
        '--disable-blink-features=AutomationControlled', // https://blog.m157q.tw/posts/2020/09/11/bypass-cloudflare-detection-while-using-selenium-with-chromedriver/
        '--disable-cloud-import',
        '--disable-component-update', // https://source.chromium.org/search?q=lang:cpp+symbol:kDisableComponentUpdate&ss=chromium
        '--disable-domain-reliability', // https://source.chromium.org/search?q=lang:cpp+symbol:kDisableDomainReliability&ss=chromium
        '--disable-features=AudioServiceOutOfProcess,IsolateOrigins,site-per-process', // https://source.chromium.org/search?q=file:content_features.cc&ss=chromium
        '--disable-gesture-typing',
        '--disable-infobars',
        '--disable-notifications',
        '--disable-offer-store-unmasked-wallet-cards',
        '--disable-offer-upload-credit-cards',
        '--disable-print-preview', // https://source.chromium.org/search?q=lang:cpp+symbol:kDisablePrintPreview&ss=chromium
        '--disable-setuid-sandbox', // https://source.chromium.org/search?q=lang:cpp+symbol:kDisableSetuidSandbox&ss=chromium
        '--disable-site-isolation-trials', // https://source.chromium.org/search?q=lang:cpp+symbol:kDisableSiteIsolation&ss=chromium
        '--disable-speech-api', // https://source.chromium.org/search?q=lang:cpp+symbol:kDisableSpeechAPI&ss=chromium
        '--disable-tab-for-desktop-share',
        '--disable-translate',
        '--disable-voice-input',
        '--disable-wake-on-wifi',
        '--enable-async-dns',
        '--enable-simple-cache-backend',
        '--enable-tcp-fast-open',
        '--enable-webgl',
        '--force-webrtc-ip-handling-policy=default_public_interface_only',
        '--ignore-gpu-blocklist', // https://source.chromium.org/search?q=lang:cpp+symbol:kIgnoreGpuBlocklist&ss=chromium
        '--in-process-gpu', // https://source.chromium.org/search?q=lang:cpp+symbol:kInProcessGPU&ss=chromium
        '--no-default-browser-check', // https://source.chromium.org/search?q=lang:cpp+symbol:kNoDefaultBrowserCheck&ss=chromium
        '--no-pings', // https://source.chromium.org/search?q=lang:cpp+symbol:kNoPings&ss=chromium
        '--no-sandbox', // https://source.chromium.org/search?q=lang:cpp+symbol:kNoSandbox&ss=chromium
        '--no-zygote', // https://source.chromium.org/search?q=lang:cpp+symbol:kNoZygote&ss=chromium
        '--prerender-from-omnibox=disabled',
        '--use-gl=swiftshader', // https://source.chromium.org/search?q=lang:cpp+symbol:kUseGl&ss=chromium
      ],
    }
    this._browserSettings = { ...defaults, ...browserSettings }
  }

  async initializeBrowser() {
    this._browser = await puppeteer
      .connect({
        browserWSEndpoint: this.pptr_instance_url,
      })
      .catch(async (err) => {
        console.log('endpoint', this.pptr_instance_url)
        this._browser = await puppeteer.launch(this._browserSettings)
        this.pptr_instance_url = this._browser.wsEndpoint()
        return this._browser
      })
  }

  closeBrowser() {
    return this._browser?.close()
  }

  async newPage() {
    if (!this._browser) return null
    const newPage = await this._browser.newPage()
    newPage.setRequestInterception(true)
    newPage.on('request', (req) =>
      req.resourceType() === 'image' ||
      req.resourceType() === 'stylesheet' ||
      req.resourceType() === 'font'
        ? req.abort()
        : req.continue(),
    )
    return newPage
  }

  async getBrowser() {
    return this._browser
  }

  async getPage() {
    if (!this._browser) {
      await this.initializeBrowser()
    }
    if (!this._page) {
      this._page = await (await this._browser.pages())[0]

      await this._page.setUserAgent(
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36',
      )
      this._page.setRequestInterception(true)
      this._page.on('request', (req) =>
        req.resourceType() === 'image' ||
        req.resourceType() === 'stylesheet' ||
        req.resourceType() === 'font'
          ? req.abort()
          : req.continue(),
      )
    }
    return this._page
  }
}
