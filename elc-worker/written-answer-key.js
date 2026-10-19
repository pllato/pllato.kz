// Teacher reference key. Only returned through authenticated review endpoints.
// Alternatives are deliberately finite: unknown phrasing needs human review.
export const KEY_VERSION='2026-10-19.1';
const groups=[
 ['nose','mouth','chin','ear','knee','leg|foot','ankle','hand','good|nice','beautiful|pretty|handsome','wonderful|marvellous|marvelous|lovely','big|large','small|little','men','children|kids','son','daughter','interesting','apartment building|block of flats|apartment block','flat|apartment|private apartment','forget|to forget','find|to find'],
 ['I ate an apple yesterday|Yesterday I ate an apple','I will not go to the cinema today|I will not go to the movies today|I am not going to the cinema today|I am not going to the movies today','Shall we meet tomorrow, Mary|Will we meet tomorrow, Mary|Are we meeting tomorrow, Mary','I do not go to school on Mondays and Wednesdays|I do not go to school on Monday and Wednesday|I do not go to school on Mondays or Wednesdays','How much does the car cost|How much does a car cost|How much is the car|How much is a car'],
 ['I am driving a car|I am driving the car|I am driving|I drive a car','I am taking a book from the table|I am taking the book from the table|I take a book from the table|I take the book from the table|I am taking the book off the table','I am just having lunch|I am only having lunch|I am just eating lunch|I am only eating lunch','I live in London|I am living in London','I am reading at the table|I read at the table','There were two flowers on my table yesterday|Yesterday there were two flowers on my table'],
 ['I have just finished this book|I have just finished reading this book|I just finished this book','My wife came home while I was sleeping|My wife came home while I was asleep','I was reading a book while my son was playing|I was reading a book and my son was playing|I was reading the book while my son was playing','I installed the door|I have installed the door|I fixed the door|I have fixed the door|I fitted the door|I secured the door'],
 ['Книга о музыке интересная|Книга о музыке интересна|Книга по музыке интересная|Книга по музыке интересна','У меня книга Джона по математике в кожаном переплёте|У меня есть книга Джона по математике в кожаном переплёте|У меня учебник Джона по математике в кожаном переплёте|У меня есть учебник Джона по математике в кожаном переплёте|У меня книга по математике Джона в кожаном переплёте'],
 ['I want my wife to cook lunch|I want my wife to make lunch|I want my wife to prepare lunch|I want my wife to cook dinner|I want my wife to make dinner|I want my wife to prepare dinner','Our teacher always makes us translate many sentences|Our teacher always makes us translate a lot of sentences|Our teacher always makes us translate lots of sentences','The man who is standing in the corner is my brother|The man standing in the corner is my brother|The person who is standing in the corner is my brother|The man that is standing in the corner is my brother'],
 ['Have you ever been to England','John and I have been friends for two years|I have been friends with John for two years|We have been friends with John for two years','I have been working for this company for five years|I have worked for this company for five years|I have been working at this company for five years|I have worked at this company for five years'],
 ['The vase was broken by the children|The vase has been broken by the children|The vase is broken by the children|The vase was broken by children','The cakes were brought for the party|The cakes have been brought for the party|Cakes were brought for the party|The pastries were brought for the party|The pastries have been brought for the party']
];
export const ANSWER_KEY=Object.fromEntries(groups.flatMap((g,s)=>g.map((v,q)=>[`s${s+1}q${q+1}`,v.split('|')])));
export function normalize(value){
 return String(value||'').normalize('NFKC').toLowerCase().replace(/ё/g,'е').replace(/[’‘`]/g,"'")
 .replace(/\bwon't\b/g,'will not').replace(/\bcan't\b/g,'cannot').replace(/\bcannot\b/g,'can not')
 .replace(/\b(i|you|we|they)'ve\b/g,'$1 have').replace(/\bi'm\b/g,'i am').replace(/\b(you|we|they)'re\b/g,'$1 are')
 .replace(/\b(i|you|he|she|it|we|they)'ll\b/g,'$1 will').replace(/\b(do|does|did|is|are|was|were|have|has|had|would|should|could)n't\b/g,'$1 not')
 .replace(/[,]/g,' ').replace(/[.!?…]+\s*$/g,'').replace(/\s+/g,' ').trim();
}
export function assess(answers={}){
 const marks={};let correct=0,skipped=0;
 for(const [id,variants] of Object.entries(ANSWER_KEY)){
  const value=normalize(answers[id]);const empty=!String(answers[id]||'').trim();
  const status=empty?'skipped':variants.some(v=>normalize(v)===value)?'correct':'review';
  if(status==='correct')correct++;if(status==='skipped')skipped++;
  marks[id]={status,variants};
 }
 const total=Object.keys(ANSWER_KEY).length,answered=total-skipped;
 return {keyVersion:KEY_VERSION,marks,total,answered,correct,skipped,needsReview:answered-correct,percent:Math.round(correct/total*100),answeredPercent:answered?Math.round(correct/answered*100):null};
}
