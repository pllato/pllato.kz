import { test } from 'node:test';
import assert from 'node:assert/strict';
import { providerUrl, cmsFromResponse, pendingEgov, clearEgov, signWithEgov } from '../contracts/egov.js';
const cms = btoa('0' + 'a'.repeat(200));
const signed = { signMethod: 'CMS_SIGN_ONLY', documentsToSign: [{ id: 1, document: { file: { data: cms } } }] };
const memory = new Map();
globalThis.sessionStorage = { getItem: k => memory.get(k) || null, setItem: (k,v) => memory.set(k,v), removeItem: k => memory.delete(k) };
globalThis.location = { href: 'https://pllato.kz/sign.html?c=test' };
let lastDialog;
globalThis.document = {
  body: { append() {} },
  createElement(tag) {
    if (tag !== 'dialog') return {};
    const nodes = new Map();
    const el = { innerHTML: '', querySelector(k) { if (!nodes.has(k)) nodes.set(k, { append() {} }); return nodes.get(k); },
      showModal() { setTimeout(() => this.querySelector('[data-start]').onclick(), 0); },
      addEventListener() {}, close() {}, remove() {},
    };
    lastDialog = el; return el;
  },
};
const operation = () => ({ expireAt: Date.now()+60000, qrCode: 'YWJj', dataURL: 'https://sigex.kz/api/egovQr/data', signURL: 'https://sigex.kz/api/egovQr/sign', eGovMobileLaunchLink: 'https://m.egov.kz/mobile', eGovBusinessLaunchLink: 'https://m.egov.kz/business' });
const args = { context: 'test', base64: btoa('original document'), title: 'Contract', mime: 'application/pdf', metadata: { signerType: 'individual' } };
const json = data => new Response(JSON.stringify(data), { status: 200 });

test('rejects cancellation, originals, wrong method/document count/id', () => {
  assert.equal(cmsFromResponse(signed), cms);
  for (const value of [{ ...signed, status: 'CANCELED' }, { ...signed, signMethod: 'XML' }, { ...signed, documentsToSign: [] }, { ...signed, documentsToSign: [...signed.documentsToSign, ...signed.documentsToSign] }, { ...signed, documentsToSign: [{ id: 2 }] }, { ...signed, documentsToSign: [{ id: 1, document: {file: {data: btoa('not a signature')}} }] }]) assert.throws(() => cmsFromResponse(value));
});
test('provider URLs reject exfiltration, credentials, insecure transport', () => {
  assert.equal(providerUrl('https://sigex.kz/api/x'), 'https://sigex.kz/api/x');
  assert.equal(providerUrl('https://egov3.sigex.kz/api/x'), 'https://egov3.sigex.kz/api/x');
  for (const url of ['https://sigex.kz.evil.test/x', 'http://sigex.kz/x', 'https://me:secret@sigex.kz/x', 'https://evil.test/x', 'javascript:alert(1)']) assert.throws(() => providerUrl(url));
});
test('expired pending session is removed', () => {
  sessionStorage.setItem('pllato.egov.v1:expired', JSON.stringify({expireAt: Date.now()-1}));
  assert.equal(pendingEgov('expired'), null);
});
test('uploads exact original, persists CMS until save acknowledgement, resumes without signing again', async () => {
  clearEgov('test'); let calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({url,options});
    if (url.endsWith('/data')) {
      const body = JSON.parse(options.body);
      assert.equal(body.documentsToSign[0].document.file.data, args.base64);
      assert.equal(body.documentsToSign[0].document.file.mime, '@file/pdf');
      return json({ signURL: operation().signURL });
    }
    return json(url.endsWith('/sign') ? signed : operation());
  };
  const result = await signWithEgov(args);
  assert.equal(result.cms, cms); assert.equal(result.tsp, false);
  assert.equal(calls.length, 3);
  assert.equal(pendingEgov('test').cms, cms);
  assert.equal((await signWithEgov(args)).cms, cms);
  assert.equal(calls.length, 3);
  clearEgov('test'); assert.equal(pendingEgov('test'), null);
});
test('resumes signature retrieval after network loss without resending original', async () => {
  clearEgov('test');
  globalThis.fetch = async url => {
    if (url.endsWith('/sign')) throw new TypeError('Network disconnected');
    return json(url.endsWith('/data') ? {signURL: operation().signURL} : operation());
  };
  await assert.rejects(signWithEgov(args), /Network disconnected/);
  assert.equal(pendingEgov('test').uploaded, true);
  globalThis.fetch = async url => { assert.ok(url.endsWith('/sign')); return json(signed); };
  assert.equal((await signWithEgov(args)).cms, cms);
  clearEgov('test');
});
test('eGov cancellation never returns a signature and removes pending session', async () => {
  globalThis.fetch = async url => json(url.endsWith('/sign') ? {...signed, status:'CANCELED'} : url.endsWith('/data') ? {signURL: operation().signURL} : operation());
  await assert.rejects(signWithEgov(args), /отменили/);
  assert.equal(pendingEgov('test'), null);
});
test('changed document invalidates cached signature', async () => {
  globalThis.fetch = async url => json(url.endsWith('/sign') ? signed : url.endsWith('/data') ? {signURL: operation().signURL} : operation());
  await signWithEgov(args); let registered = false;
  globalThis.fetch = async url => { if(url === 'https://sigex.kz/api/egovQr') registered = true; return json(url.endsWith('/sign') ? signed : url.endsWith('/data') ? {signURL: operation().signURL} : operation()); };
  await signWithEgov({...args, base64: btoa('different original')});
  assert.equal(registered, true); clearEgov('test');
});
