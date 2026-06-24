import { Router, type Request, type Response } from 'express'
import multer from 'multer'
import {
  saveFile,
  getFileList,
  getFileById,
  getFilePath,
  deleteFile
} from '../services/fileService.js'

const router = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024
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
    res.status(200).json({
      success: true,
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
    const fileItem = await getFileById(req.params.id)
    if (!fileItem) {
      res.status(404).json({
        success: false,
        error: '文件不存在'
      })
      return
    }

    if (new Date(fileItem.expireTime).getTime() <= Date.now()) {
      await deleteFile(fileItem.id)
      res.status(404).json({
        success: false,
        error: '文件已过期'
      })
      return
    }

    const filePath = await getFilePath(fileItem)
    const filename = fileItem.name
    const filenameEncoded = encodeURIComponent(filename)
    
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${filenameEncoded}`)
    res.download(filePath, filename)
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
    const fileItem = await getFileById(req.params.id)
    if (!fileItem) {
      res.status(404).json({
        success: false,
        error: '文件不存在'
      })
      return
    }

    if (!fileItem.type.startsWith('image/')) {
      res.status(400).json({
        success: false,
        error: '该文件不支持预览'
      })
      return
    }

    if (new Date(fileItem.expireTime).getTime() <= Date.now()) {
      await deleteFile(fileItem.id)
      res.status(404).json({
        success: false,
        error: '文件已过期'
      })
      return
    }

    const filePath = await getFilePath(fileItem)
    res.sendFile(filePath)
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
