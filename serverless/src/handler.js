const fetch = require('node-fetch')
const googleTrends = require('google-trends-api')

const formatLookup = (resp) => {
  if (!resp.length) {
    return {}
  }
  resp = resp[0]
  let {
    ams,
    cmp,
    cpc,
    gms,
    lms,
    keyword,
    competition
  } = resp
  let i = 1
  let data = []
  while (i <= 12) {
    if (resp[`m${i}`]) {
      let volume = resp[`m${i}`]
      let month = resp[`m${i}_month`]
      data.push({ volume, month })
      i++
    }
  }
  return {
    ams,
    cmp,
    cpc,
    lms,
    gms,
    keyword,
    competition,
    data
  }
}

const {
  WEBKNOX_API_KEY,
  GREPWORDS_API_KEY
} = process.env

const createResponse = (message = {}) => ({
  statusCode: 200,
  body: typeof message === 'string'
    ? message
    : JSON.stringify(message),
  headers: {
    'Access-Control-Allow-Origin': '*'
  }
})

const handler = {
  lookup: (keyword) => {
    const url = `http://api.grepwords.com/lookup?apikey=${GREPWORDS_API_KEY}&q=${keyword}`
    return fetch(url, {
      method: 'get'
    }).then(resp => resp.json())
      .then(resp => formatLookup(resp))
  },
  stats: (keyword) => {
    const url = `https://webknox-keywords.p.mashape.com/keywords/${keyword}`
    console.log(url)
    return fetch(url, {
      method: 'get',
      headers: {
        'X-Mashape-Key': `${WEBKNOX_API_KEY}`,
        'Accept': 'application/json'
      }
    }).then(resp => resp.json())
      .then(resp => {
        console.log(resp)
        return resp
      })
  },
  trends: (keyword) => {
    keyword = keyword.replace('+', ' ')
    return googleTrends.interestOverTime({ keyword: keyword })
  },
  synonyms: (word) => {
    const url = `https://wordsapiv1.p.mashape.com/words/${word}/synonyms`
    return fetch(url, {
      method: 'get',
      headers: {
        'X-Mashape-Key': `${WEBKNOX_API_KEY}`,
        'Accept': 'application/json'
      }
    }).then(resp => resp.json())
  }
}

const endpoint = name => (evt, ctx, cb) => {
  const { id } = (evt && evt.pathParameters) || {}
  handler[name](id).then(data => {
    cb(null, createResponse(data))
  }).catch(error => {
    cb(null, createResponse(error))
  })
}

module.exports.lookup = endpoint('lookup')
module.exports.stats = endpoint('stats')
module.exports.trends = endpoint('trends')
module.exports.synonyms = endpoint('synonyms')
