import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import express from 'express';
import { generateKeyPair, exportJWK, SignJWT } from 'jose';
import { auth0Middleware } from '../src/auth0.js';

test('Auth0 vérifie signature, audience, expiration et lie uniquement le subject', async () => {
  const { publicKey,privateKey } = await generateKeyPair('RS256');
  const jwk = { ...await exportJWK(publicKey),kid:'test-key',use:'sig',alg:'RS256' };
  const keyApp=express().get('/.well-known/jwks.json',(_req,res)=>res.json({keys:[jwk]}));
  const keyServer=keyApp.listen(0);
  const issuer=`http://127.0.0.1:${keyServer.address().port}/`;
  keyApp.get('/.well-known/openid-configuration',(_req,res)=>res.json({issuer,jwks_uri:`${issuer}.well-known/jwks.json`}));
  const stored=[];
  const pool={ query:async (_sql,args)=>{ stored.push(args[1]);return { rows:[{ id:args[0],disabled_at:null }] }; } };
  const app=express();
  app.get('/private',...auth0Middleware(pool,{ issuerBaseURL:issuer,audience:'https://weareplatemate.com/api' }),(req,res)=>res.json(req.user));
  app.use((error,_req,res,_next)=>res.status(error.status || 500).json({error:error.message}));
  const server=app.listen(0),base=`http://127.0.0.1:${server.address().port}`;
  const sign=async (aud,subject='auth0|user123')=>new SignJWT({ 'https://weareplatemate.com/email':'test@example.com','https://weareplatemate.com/email_verified':true }).setProtectedHeader({alg:'RS256',kid:'test-key'}).setIssuer(issuer).setAudience(aud).setSubject(subject).setIssuedAt().setExpirationTime('5m').sign(privateKey);
  try {
    assert.equal((await fetch(`${base}/private`)).status,401);
    const valid=await fetch(`${base}/private`,{headers:{authorization:`Bearer ${await sign('https://weareplatemate.com/api')}`}});
    assert.equal(valid.status,200);
    assert.equal((await valid.json()).email,'test@example.com');
    assert.deepEqual(stored,['auth0|user123']);
    assert.equal((await fetch(`${base}/private`,{headers:{authorization:`Bearer ${await sign('wrong-audience')}`}})).status,401);
    assert.equal((await fetch(`${base}/private`,{headers:{authorization:`Bearer ${await sign('https://weareplatemate.com/api','app@clients')}`}})).status,403);
  } finally {
    await new Promise(resolve=>server.close(resolve));
    await new Promise(resolve=>keyServer.close(resolve));
  }
});
