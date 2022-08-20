# Sitemap com as cidades
https://fatalmodel.com/shared/sitemap-cities.xml


   async requestHandler({ request, page }) {
      log.debug(`Processing ${request.url}...`)

      const title = await page.title()

      const description = await page.$eval(
        'head > meta[name="description"]',
        (el: HTMLTemplateElement) => el.content || '',
      )

      const profile_details = await page.$eval(
        '.profile-details__information',
        (el: HTMLTemplateElement) => el.innerText,
      )

      const followers_count = await page.$eval(
        '.followers__count',
        (el: HTMLTemplateElement) => el.innerText,
      )

      await page.waitForSelector(
        'button.profile-contact__button.profile-contact__whatsapp',
      )
      await page.click(
        'button.profile-contact__button.profile-contact__whatsapp',
      )
      await page.waitForSelector('.phone-modal__whatsapp-number')
      const whatsapp = await page.$eval(
        '.phone-modal__whatsapp-number',
        (el: HTMLTemplateElement) => el.innerText,
      )

      // Store the results to the dataset. In local configuration,
      // the data will be stored as JSON files in ./storage/datasets/default
      await Actor.pushData({
        url: request.url,
        title,
        description,
        profile_details,
        followers_count,
        whatsapp,
      })
    },