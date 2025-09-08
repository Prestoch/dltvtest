const fs = require('fs');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

function normalizeName(s) {
  if (!s) return '';
  const a = (s + '').toLowerCase();
  const outworld = a === 'outworld devourer' ? 'outworld destroyer' : s;
  return outworld.replace(/[^A-Za-z0-9 ]/g, '').replace(/[0-9]+/g, '').toLowerCase();
}

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

async function openAndWait(page, url, needHeroesTable = false) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    (need) => {
      const t = document.body ? (document.body.innerText || '') : '';
      const cf = /Just a moment|Attention Required|Checking your browser/i.test(t);
      if (cf) return false;
      const anchors = document.querySelectorAll('a[href^="/heroes/"]');
      const rows = document.querySelectorAll('table tbody tr');
      return anchors.length > 10 && (!need || rows.length > 5);
    },
    { timeout: 120000 },
    needHeroesTable
  );
  // small settle wait
  await new Promise(r => setTimeout(r, 1500));
}

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox','--disable-setuid-sandbox','--disable-blink-features=AutomationControlled']
  });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(120000);
  await page.setUserAgent(UA);
  await page.setExtraHTTPHeaders({ 'accept-language': 'en-US,en;q=0.9' });

  // 1) Heroes list (1-year)
  const heroesUrl = 'https://www.dotabuff.com/heroes?show=heroes&view=meta&mode=all-pick&date=1y';
  await openAndWait(page, heroesUrl, true);
  const heroes = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('table tbody tr'));
    const set = new Set();
    for (const tr of rows) {
      const a = tr.querySelector('a[href^="/heroes/"]');
      if (a && a.textContent) set.add(a.textContent.trim());
    }
    return Array.from(set);
  });
  if (!heroes.length) throw new Error('Failed to read heroes list');

  // 2) Global WR per hero (same page)
  const heroesWR = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('table tbody tr'));
    const wr = [];
    for (const tr of rows) {
      const a = tr.querySelector('a[href^="/heroes/"]');
      if (!a) continue;
      const tds = Array.from(tr.querySelectorAll('td'));
      let raw = '';
      for (let i = tds.length - 1; i >= 0; i--) {
        const v = tds[i].textContent.trim();
        if (/%$/.test(v)) { raw = v; break; }
      }
      wr.push((raw || '0').replace('%',''));
    }
    return wr;
  });
  if (!heroesWR.length || heroesWR.length !== heroes.length) throw new Error('Failed to read heroes WR');

  // 3) NxN matchups via counters?date=1y
  const winRates = Array.from({ length: heroes.length }, () => Array.from({ length: heroes.length }, () => ['0.00']));

  const concurrency = 4;
  const queue = heroes.map((h, idx) => ({
    idx,
    slug: h.toLowerCase().replace(/[^a-z0-9 ]/g,'').replace(/ +/g,'-')
  }));

  async function processHero(item) {
    const url = `https://www.dotabuff.com/heroes/${item.slug}/counters?date=1y`;
    const p = await browser.newPage();
    p.setDefaultNavigationTimeout(120000);
    await p.setUserAgent(UA);
    await p.setExtraHTTPHeaders({ 'accept-language': 'en-US,en;q=0.9' });

    await openAndWait(p, url, true);
    const data = await p.evaluate(() => {
      const result = [];
      const table = document.querySelector('table');
      if (!table) return result;
      const rows = Array.from(table.querySelectorAll('tbody tr'));
      for (const tr of rows) {
        const a = tr.querySelector('a[href^="/heroes/"]');
        if (!a) continue;
        const opp = a.textContent.trim();
        const tds = Array.from(tr.querySelectorAll('td'));
        let adv = '';
        for (const td of tds) {
          const v = td.textContent.trim();
          if (/^[+-]?[0-9]+(\\.[0-9]+)?%$/.test(v)) { adv = v; break; }
        }
        result.push({ opp, adv });
      }
      return result;
    });
    await p.close();

    for (const row of data) {
      const i = item.idx;
      const j = heroes.findIndex(x => normalizeName(x) === normalizeName(row.opp));
      if (j >= 0) {
        const val = (row.adv || '0').replace('%','');
        winRates[i][j] = [val];
      }
    }
  }

  const running = [];
  while (queue.length || running.length) {
    while (queue.length && running.length < concurrency) {
      const item = queue.shift();
      const pr = processHero(item).catch(()=>{}).then(() => {
        const idx = running.indexOf(pr);
        if (idx >= 0) running.splice(idx,1);
      });
      running.push(pr);
    }
    if (running.length) await Promise.race(running);
  }

  await browser.close();

  const payload =
    'var heroes = ' + JSON.stringify(heroes) +
    ', heroes_bg = ' + JSON.stringify([]) +
    ', heroes_wr = ' + JSON.stringify(heroesWR) +
    ', win_rates = ' + JSON.stringify(winRates) +
    ', update_time = \"' + (new Date().toISOString().slice(0,10)) + '\"' +
    ', new_generator = true;';

  fs.writeFileSync('cs.json', payload);
  console.log('cs.json written, heroes:', heroes.length);
})();
