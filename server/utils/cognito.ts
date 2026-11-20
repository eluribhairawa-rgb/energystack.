import crypto from 'node:crypto'
import {
  CognitoIdentityProviderClient,
  GetUserCommand,
  AdminGetUserCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand
} from '@aws-sdk/client-cognito-identity-provider'
import type { H3Event } from 'h3'

// Server-side Cognito client. Uses the default AWS credential chain (the ECS
// task role in deployed environments) — never static keys.
let client: CognitoIdentityProviderClient | null = null

export function getCognitoClient() {
  if (!client) {
    const config = useRuntimeConfig()
    client = new CognitoIdentityProviderClient({ region: config.public.cognitoRegion })
  }
  return client
}

export interface AuthenticatedUser {
  sub: string
  email: string
  emailVerified: boolean
  name?: string
}

// Authenticates a server request by validating the Cognito access token the
// client sends in `Authorization: Bearer <accessToken>`. GetUser both
// verifies the token (Cognito rejects expired/invalid ones) and returns the
// user's attributes, so no separate JWT-verification library is needed here.
export async function getAuthenticatedUser(event: H3Event): Promise<AuthenticatedUser> {
  const authHeader = getRequestHeader(event, 'authorization') || ''
  const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null

  if (!accessToken) {
    throw createError({ statusCode: 401, statusMessage: 'Missing bearer token' })
  }

  try {
    const result = await getCognitoClient().send(new GetUserCommand({ AccessToken: accessToken }))
    const attrs = Object.fromEntries((result.UserAttributes || []).map((a) => [a.Name, a.Value]))

    return {
      sub: attrs.sub || '',
      email: attrs.email || '',
      emailVerified: attrs.email_verified === 'true',
      name: attrs.name
    }
  } catch (e: any) {
    console.error('[Cognito] Failed to authenticate request:', e.message)
    throw createError({ statusCode: 401, statusMessage: 'Invalid or expired session' })
  }
}

function randomPassword() {
  // Cognito's default password policy: >=8 chars, upper+lower+number.
  return `Aa1${crypto.randomBytes(24).toString('base64url')}`
}

// Any email can log in via the magic-link code, whether or not it already
// has an account — this creates a passwordless, CONFIRMED Cognito user on
// the fly if one doesn't exist yet (a random password nobody knows is set
// via AdminSetUserPassword so the account skips FORCE_CHANGE_PASSWORD).
// Used by both server/api/otp.post.ts (magic-link request) and
// server/api/invite.post.ts (subscribe flow) so the two account-creation
// paths stay identical.
export async function ensurePasswordlessUser(email: string): Promise<{ created: boolean }> {
  const config = useRuntimeConfig()
  const userPoolId = config.public.cognitoUserPoolId as string
  const client = getCognitoClient()

  try {
    await client.send(new AdminGetUserCommand({ UserPoolId: userPoolId, Username: email }))
    return { created: false }
  } catch (e: any) {
    if (e.name !== 'UserNotFoundException') throw e
  }

  await client.send(new AdminCreateUserCommand({
    UserPoolId: userPoolId,
    Username: email,
    UserAttributes: [
      { Name: 'email', Value: email },
      { Name: 'email_verified', Value: 'true' },
      { Name: 'name', Value: 'Energystacks User' }
    ],
    MessageAction: 'SUPPRESS'
  }))

  await client.send(new AdminSetUserPasswordCommand({
    UserPoolId: userPoolId,
    Username: email,
    Password: randomPassword(),
    Permanent: true
  }))

  return { created: true }
}
