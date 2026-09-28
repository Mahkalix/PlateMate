import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';

const upload=multer({ storage:multer.memoryStorage(), limits:{ fileSize:3*1024*1024,files:1 } });
export function mediaRoutes(requireUser) {
  const router=express.Router();
  const dir=process.env.MEDIA_DIR || path.resolve('media');
  router.post('/media',requireUser,upload.single('photo'),async (req,res,next)=>{
    if (!req.file) return res.status(400).json({ error:'Photo requise' });
    try {
      const result=await sharp(req.file.buffer,{ limitInputPixels:20_000_000 }).rotate().resize({width:1600,height:1600,fit:'inside',withoutEnlargement:true}).webp({quality:82}).toBuffer();
      const name=`${randomUUID()}.webp`;
      await mkdir(dir,{recursive:true});
      await writeFile(path.join(dir,name),result,{flag:'wx',mode:0o644});
      res.status(201).json({ url:`${process.env.API_PUBLIC_URL || process.env.APP_ORIGIN || `http://localhost:${process.env.PORT||3000}`}/api/media/${name}` });
    } catch (error) { if (error.message?.includes('Unsupported') || error.message?.includes('Input')) return res.status(400).json({ error:'Image invalide' }); next(error); }
  });
  router.get('/media/:filename',async (req,res,next)=>{
    if (!/^[a-f0-9-]{36}\.webp$/.test(req.params.filename)) return res.status(404).end();
    try { const data=await readFile(path.join(dir,req.params.filename)); res.set('content-type','image/webp').set('cache-control','public, max-age=31536000, immutable').send(data); }
    catch (error) { if (error.code==='ENOENT') return res.status(404).end(); next(error); }
  });
  return router;
}
