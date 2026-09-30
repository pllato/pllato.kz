const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});try{
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/app/gate.js',r=>r.fulfill({body:''}));
 await page.goto('http://127.0.0.1:8817/app/stroy/dwg/');await page.locator('#focusWorkspace').waitFor();assert.equal(await page.locator('#guideWelcome,#guideButton,#dwgGuide').count(),0);
 await page.goto('http://127.0.0.1:8817/app/stroy/dwg/guide.html');await page.locator('#guideChapters section').first().waitFor();assert.equal(await page.locator('#guideChapters section').count(),18);assert.equal(await page.locator('#quizQuestions fieldset').count(),10);
 await page.locator('#guideChapters input').first().check();await page.reload();await page.waitForFunction(()=>document.querySelector('#trainingProgress').textContent.includes('1 из 18'));
 const answers=await page.evaluate(async()=>{const m=await import('./training-content.mjs?v=0.17.48');return m.questions.map(q=>q.answer);});
 for(let i=0;i<answers.length;i++)await page.locator(`input[name=q${i}][value="${i===0?(answers[i]+1)%3:answers[i]}"]`).check();await page.getByRole('button',{name:'Проверить ответы'}).click();assert.match(await page.locator('#quizResult').textContent(),/9 из 10/);assert.equal(await page.locator('#quizResult a[href="#units"]').count(),1);
 await page.locator('#retryQuiz').click();assert.equal(await page.locator('#quizResult').isVisible(),false);assert.equal(await page.locator('#quiz input:checked').count(),0);
 await page.screenshot({path:'/private/tmp/dwg-training-desktop.png'});await page.setViewportSize({width:390,height:844});await page.evaluate(()=>scrollTo(0,0));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:'/private/tmp/dwg-training-mobile.png'});
 assert.deepEqual(errors,[]);
 await page.goto('http://127.0.0.1:8817/app/stroy/dwg/guide.html?k=training-test');await page.locator('#guideChapters section').first().waitFor();assert.match(await page.locator('a[data-destination]').first().getAttribute('href'),/k=training-test/);
 await page.goto('http://127.0.0.1:8817/app/stroy/plan-fakt/?k=training-test');await page.locator('#dwgTrainingTitle').waitFor({state:'attached'});const link=page.getByRole('link',{name:'Пройти обучение и тест'});assert.match(await link.getAttribute('href'),/guide.html\?k=training-test/);
 console.log('PASS standalone lessons, no onboarding in editor, local progress, quiz scoring/review/retry, mobile, launch card and access links');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
