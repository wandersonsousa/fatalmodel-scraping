import { getLinksFromCnpjList, searchRequestInject } from './helpers'

async function scrapeAdvancedSearchPage(page, requestBodyConfig) {
  await page.goto(
    'https://casadosdados.com.br/solucao/cnpj/pesquisa-avancada',
    { waitUntil: 'domcontentloaded' },
  )
  const cnpjListData = []
  const currentPage = 1

  requestBodyConfig.page = currentPage
  const firstPageData = await searchRequestInject(page, requestBodyConfig)
  if (firstPageData.data.count === 0) {
    return []
  }

  if (firstPageData.data.count > 1000) {
    const finalPageNumber = 50

    for (let i = currentPage; i <= finalPageNumber; i++) {
      requestBodyConfig.page = i
      const pageData = await searchRequestInject(page, requestBodyConfig)
      cnpjListData.push(...pageData.data.cnpj)
    }

    return cnpjListData
  }

  if (firstPageData.data.count <= 20) {
    cnpjListData.push(...firstPageData.data.cnpj)
    return cnpjListData
  }

  const finalPageNumber = Math.ceil(firstPageData.data.count / 20)
  for (let i = currentPage; i <= finalPageNumber; i++) {
    requestBodyConfig.page = i
    const pageData = await searchRequestInject(page, requestBodyConfig)
    cnpjListData.push(...pageData.data.cnpj)
  }
  return cnpjListData
}

export async function getMinifiedCnpjDataToScrape(page, filters) {
  const cnpjsIncompleteData = await scrapeAdvancedSearchPage(page, {
    requestFilters: filters,
  })
  return cnpjsIncompleteData.map((incompleteData) => {
    const url =
      'https://casadosdados.com.br/solucao/cnpj/' +
      incompleteData.razao_social
        ?.replaceAll(/\d/g, '')
        .trim()
        .replaceAll(' ', '-')
        .replaceAll('/', '')
        .toLowerCase() +
      '-' +
      incompleteData.cnpj.replaceAll(' ', '-').replaceAll('/', '')

    return { ...incompleteData, url }
  })
}

export async function getUrlsToScrape(page, filters) {
  const cnpjsIncompleteData = await scrapeAdvancedSearchPage(page, {
    requestFilters: filters,
  })
  const linksFromCnpjList = getLinksFromCnpjList(cnpjsIncompleteData)
  return linksFromCnpjList
}

export async function getCnpjsToScrape(page, filters) {
  const cnpjsIncompleteData = await scrapeAdvancedSearchPage(page, {
    requestFilters: filters,
  })
  const cnpj_list = cnpjsIncompleteData.map((item) => item.cnpj)
  return cnpj_list
}

export async function getDataInUrl(url, page) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 0 })
  const dataLayer = await page.evaluate('__NUXT__')
  const data = dataLayer.data[0]['cnpj']
  return data
}
