const express = require('express')
const puppeteer = require('puppeteer')

const PORT = process.env.PORT || 8080
const app = express()

import { getCnpjsToScrape } from './CasaDadosCrowler'
import { BrowserCrowler } from './internal/BrowserCrowler'
const browserCrowler = new BrowserCrowler()

app.get('/', function (req, res) {
  ;(async () => {
    try {
      await browserCrowler.initializeBrowser()
      const url =
        'https://stackoverflow.com/questions/44764004/ts-node-is-not-recognized-as-an-internal-or-external-command-operable-program'

      const page = await browserCrowler.newPage()

      const resp = await getCnpjsToScrape(page, {
        query: {
          termo: [],
          atividade_principal: [],
          natureza_juridica: [],
          uf: ['PI'],
          municipio: [],
          situacao_cadastral: 'ATIVA',
          cep: [],
          ddd: [],
        },
        range_query: {
          data_abertura: {
            lte: null,
            gte: '2022-08-12',
          },
          capital_social: {
            lte: null,
            gte: null,
          },
        },
        extras: {
          somente_mei: false,
          excluir_mei: false,
          com_email: false,
          incluir_atividade_secundaria: false,
          com_contato_telefonico: false,
          somente_fixo: false,
          somente_celular: false,
          somente_matriz: false,
          somente_filial: false,
        },
        page: 1,
      })
      res.send(resp)
    } catch (error) {
      console.log('err', error)
    }
  })()
})

app.listen(PORT, function () {
  console.log('App listening on port ' + PORT)
})
