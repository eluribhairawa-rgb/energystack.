import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getAuthenticatedUser } from '../utils/cognito'

// Replaces `useSupabaseClient().storage.from('avatars').upload(...)`.
// Avatars are stored in the same S3 bucket as other app assets, served
// through the CloudFront distribution in front of it (see infra ASSETS_BASE_URL).
export default defineEventHandler(async (event) => {
  const { sub } = await getAuthenticatedUser(event)
  const config = useRuntimeConfig()
  const body = await readBody<{ fileName: string; contentType: string; dataBase64: string }>(event)

  if (!body?.dataBase64 || !body?.contentType || !body?.fileName) {
    throw createError({ statusCode: 400, statusMessage: 'fileName, contentType, and dataBase64 are required' })
  }

  const bucket = process.env.S3_BUCKET
  if (!bucket) {
    throw createError({ statusCode: 500, statusMessage: 'S3_BUCKET is not configured on this environment' })
  }

  const ext = body.fileName.split('.').pop() || 'jpg'
  const key = `avatars/${sub}/${Date.now()}.${ext}`

  const s3 = new S3Client({ region: config.public.cognitoRegion })
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: Buffer.from(body.dataBase64, 'base64'),
    ContentType: body.contentType
  }))

  const publicUrl = `${config.public.assetsBaseUrl}/${key}`
  return { url: publicUrl }
})
