export function getLinksFromCnpjList(cnpjListData) {
  const links = cnpjListData.map(
    (cnpjData) =>
      'https://casadosdados.com.br/solucao/cnpj/' +
      cnpjData.razao_social
        ?.replaceAll(/\d/g, '')
        .trim()
        .replaceAll(' ', '-')
        .replaceAll('/', '')
        .toLowerCase() +
      '-' +
      cnpjData.cnpj.replaceAll(' ', '-').replaceAll('/', ''),
  )
  const uniqueLinks = [...new Set(links)]
  return uniqueLinks
}

export async function searchRequestInject(page, requestBodyConfig) {
  const searchResponse = await page.evaluate(async (requestBodyConfig) => {
    const bodyConfig = {
      ...requestBodyConfig.requestFilters,
      page: requestBodyConfig.page,
    }

    function requestInject(bodyConfig) {
      return window
        .fetch('https://api.casadosdados.com.br/v2/public/cnpj/search', {
          headers: {
            accept: 'application/json, text/plain, */*',
            'accept-language': 'en-US,en;q=0.9',
            'content-type': 'application/json;charset=UTF-8',
            'sec-ch-ua':
              '"Chromium";v="92", " Not A;Brand";v="99", "Google Chrome";v="92"',
            'sec-ch-ua-mobile': '?0',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-site',
          },
          referrer: 'https://casadosdados.com.br/',
          referrerPolicy: 'strict-origin-when-cross-origin',
          body: JSON.stringify(bodyConfig),
          method: 'POST',
          mode: 'cors',
        })
        .then((res) => res.json())
        .then((json) => json)
        .catch((err) => console.log(err))
    }

    const cnpjDataFromFilter = await requestInject(bodyConfig)

    return cnpjDataFromFilter
  }, requestBodyConfig)

  if (!searchResponse.success) {
    throw new Error('Error injecting the request')
  }

  return searchResponse
}
