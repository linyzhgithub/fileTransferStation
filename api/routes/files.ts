import { Router, type Request, type Response } from 'express'
import multer from 'multer'
import path from 'path'
import {
  saveFile,
  getFileList,
  getFileById,
  deleteFile,
  getCurrentDirectory,
  setCurrentDirectory,
  listDirectory
} from '../services/fileService.js'

const router = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024
  }
})

router.get('/directory', async (req: Request, res: Response) => {
  try {
    const dir = req.query.dir as string
    const currentDir = await getCurrentDirectory()
    const targetDir = dir || currentDir
    
    const result = await listDirectory(targetDir)
    
    res.status(200).json({
      success: true,
      currentDirectory: targetDir,
      ...result
    })
  } catch (error) {
    console.error('List directory error:', error)
    res.status(500).json({
      success: false,
      error: '获取目录内容失败'
    })
  }
})

router.post('/directory', async (req: Request, res: Response) => {
  try {
    const { path: dirPath } = req.body
    if (!dirPath) {
      res.status(400).json({
        success: false,
        error: '目录路径不能为空'
      })
      return
    }
    
    const newDir = await setCurrentDirectory(dirPath)
    const result = await listDirectory(newDir)
    
    res.status(200).json({
      success: true,
      currentDirectory: newDir,
      ...result
    })
  } catch (error) {
    console.error('Set directory error:', error)
    res.status(500).json({
      success: false,
      error: '设置目录失败'
    })
  }
})

router.get('/current-directory', async (req: Request, res: Response) => {
  try {
    const dir = await getCurrentDirectory()
    res.status(200).json({
      success: true,
      directory: dir
    })
  } catch (error) {
    console.error('Get current directory error:', error)
    res.status(500).json({
      success: false,
      error: '获取当前目录失败'
    })
  }
})

router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: '未选择文件'
      })
      return
    }

    const expireHours = req.body.expireHours ? parseInt(req.body.expireHours) : undefined
    
    let filename = req.file.originalname
    if (req.body.filename) {
      try {
        filename = decodeURIComponent(escape(atob(req.body.filename)))
      } catch {
        console.log('Could not decode base64 filename, using original')
      }
    }
    
    const fileItem = await saveFile(
      filename,
      req.file.buffer,
      req.file.mimetype,
      expireHours
    )

    res.status(200).json({
      success: true,
      file: fileItem
    })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({
      success: false,
      error: '文件上传失败'
    })
  }
})

router.get('/files', async (req: Request, res: Response) => {
  try {
    const result = await getFileList()
    const currentDir = await getCurrentDirectory()
    res.status(200).json({
      success: true,
      currentDirectory: currentDir,
      ...result
    })
  } catch (error) {
    console.error('Get files error:', error)
    res.status(500).json({
      success: false,
      error: '获取文件列表失败'
    })
  }
})

router.get('/download/:id', async (req: Request, res: Response) => {
  try {
    const result = await getFileById(req.params.id)
    if (!result.file) {
      res.status(404).json({
        success: false,
        error: '文件不存在'
      })
      return
    }

    if (!result.isLocal && result.file.expireTime) {
      if (new Date(result.file.expireTime).getTime() <= Date.now()) {
        await deleteFile(result.file.id)
        res.status(404).json({
          success: false,
          error: '文件已过期'
        })
        return
      }
    }

    const filename = result.file.name
    const filenameEncoded = encodeURIComponent(filename)
    
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${filenameEncoded}`)
    res.setHeader('Content-Type', result.file.type)
    res.sendFile(result.path)
  } catch (error) {
    console.error('Download error:', error)
    res.status(500).json({
      success: false,
      error: '文件下载失败'
    })
  }
})

router.get('/preview/:id', async (req: Request, res: Response) => {
  try {
    const result = await getFileById(req.params.id)
    if (!result.file) {
      res.status(404).json({
        success: false,
        error: '文件不存在'
      })
      return
    }

    if (!result.file.type.startsWith('image/')) {
      res.status(400).json({
        success: false,
        error: '该文件不支持预览'
      })
      return
    }

    if (!result.isLocal && result.file.expireTime) {
      if (new Date(result.file.expireTime).getTime() <= Date.now()) {
        await deleteFile(result.file.id)
        res.status(404).json({
          success: false,
          error: '文件已过期'
        })
        return
      }
    }

    res.sendFile(result.path)
  } catch (error) {
    console.error('Preview error:', error)
    res.status(500).json({
      success: false,
      error: '文件预览失败'
    })
  }
})

router.delete('/files/:id', async (req: Request, res: Response) => {
  try {
    const success = await deleteFile(req.params.id)
    if (!success) {
      res.status(404).json({
        success: false,
        error: '文件不存在'
      })
      return
    }

    res.status(200).json({
      success: true,
      message: '文件已删除'
    })
  } catch (error) {
    console.error('Delete error:', error)
    res.status(500).json({
      success: false,
      error: '文件删除失败'
    })
  }
})

export default router
