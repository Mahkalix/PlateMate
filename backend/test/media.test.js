import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import express from 'express';
import sharp from 'sharp';
import { mediaRoutes } from '../src/media.js';

test('photo : décode, réencode en WebP et rejette les fichiers invalides',async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'platemate-media-'));
  const previous=process.env.MEDIA_DIR;
  const previousPublicUrl=process.env.API_PUBLIC_URL;
  process.env.MEDIA_DIR=dir;
  const app=express().use('/api',mediaRoutes((_req,_res,next)=>next()));
  const server=app.listen(0),base=`http://127.0.0.1:${server.address().port}`;
  process.env.API_PUBLIC_URL=base;
  const send=async(bytes)=>{const form=new FormData();form.set('photo',new Blob([bytes]),'photo.png');return fetch(`${base}/api/media`,{method:'POST',body:form});};
  try {
    assert.equal((await send(Buffer.from('invalid'))).status,400);
    const photo=await sharp({create:{width:100,height:100,channels:3,background:'red'}}).png().toBuffer();
    const uploaded=await send(photo);
    assert.equal(uploaded.status,201);
    const {url}=await uploaded.json();
    const served=await fetch(url);
    assert.equal(served.status,200);
    assert.equal((await sharp(Buffer.from(await served.arrayBuffer())).metadata()).format,'webp');
  }finally{
    await new Promise(resolve=>server.close(resolve));
    await rm(dir,{recursive:true,force:true});
    if(previous===undefined)delete process.env.MEDIA_DIR;else process.env.MEDIA_DIR=previous;
    if(previousPublicUrl===undefined)delete process.env.API_PUBLIC_URL;else process.env.API_PUBLIC_URL=previousPublicUrl;
  }
});
