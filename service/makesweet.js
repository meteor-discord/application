const superagent = require('superagent');

const effects = ['billboard-cityscape', 'circuit-board', 'flag', 'flying-bear', 'heart-locket', 'nesting-doll'];

async function fetchImage(url) {
  try {
    let res = await superagent.get(`https://external-content.duckduckgo.com/iu/`).query({
      u: url,
    });
    return res.body;
  } catch (e) {
    return null;
  }
}

async function processMakesweet(effect, args, image) {
  if (!effects.includes(effect.toLowerCase())) throw 'Invalid Effect';
  try {
    if (image) {
      image = await fetchImage(image);
      if (!image) throw 'Unable to fetch image';

      let res = await superagent
        .post(`http://api.makesweet.com/make/${effect.toLowerCase()}`)
        .set('Authorization', process.env.MAKESWEET_KEY)
        .buffer(true)
        .query(args)
        .attach('image', image, 'image.png');
      return res;
    }
    let res = await superagent
      .post(`http://api.makesweet.com/make/${effect.toLowerCase()}`)
      .set('Authorization', process.env.MAKESWEET_KEY)
      .buffer(true)
      .query(args);
    return res;
  } catch (e) {
    console.log(e);
    throw 'Unable to generate image.';
  }
}

exports.heartLocket = async (text, url) => {
  return await processMakesweet('heart-locket', { text: text, textfirst: 1 }, url);
};

exports.billboardCityscape = async url => {
  return await processMakesweet('billboard-cityscape', {}, url);
};

exports.circuitBoard = async url => {
  return await processMakesweet('circuit-board', {}, url);
};

exports.flag = async url => {
  return await processMakesweet('flag', {}, url);
};

/*exports.flyingBear = async (text, url) => {
  return await processMakesweet("flying-bear", { text: text, textfirst: 1 }, url)
}

exports.nestingDoll = async (text, url) => {
  return await processMakesweet("nesting-doll", { text: text, textfirst: 1 }, url)
}*/
