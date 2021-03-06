// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import express from 'express'
import { Router } from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import setupLoggingMiddleware from '../shared/logging'
import { cookieSecret, enableDevApi } from '../shared/config'
import { errorHandler } from '../shared/middleware/error-handler'
import csp from '../shared/routes/csp'
import { requireAuthentication } from '../shared/auth'
import session, { refreshLogoutToken } from '../shared/session'
import passport from 'passport'
import { csrf, csrfCookie } from '../shared/middleware/csrf'
import { trustReverseProxy } from '../shared/reverse-proxy'
import { createProxy } from '../shared/proxy-utils'
import nocache from 'nocache'
import helmet from 'helmet'
import tracing from '../shared/middleware/tracing'
import mobileDeviceSession, {
  refreshMobileSession
} from './mobile-device-session'
import authStatus from './routes/auth-status'
import createSamlRouter from '../shared/routes/auth/saml'
import createEspooAdSamlStrategy from '../shared/auth/espoo-ad-saml'
import createEvakaSamlStrategy from '../shared/auth/keycloak-saml'

const app = express()
trustReverseProxy(app)
app.set('etag', false)
app.use(nocache())
app.use(
  helmet({
    // Content-Security-Policy is set by the nginx proxy
    contentSecurityPolicy: false
  })
)
app.get('/health', (req, res) => res.status(200).json({ status: 'UP' }))
app.use(tracing)
app.use(bodyParser.json({ limit: '8mb' }))
app.use(session('employee'))
app.use(cookieParser(cookieSecret))
app.use(passport.initialize())
app.use(passport.session())
passport.serializeUser((user, done) => done(null, user))
passport.deserializeUser((user, done) => done(null, user))
app.use(refreshLogoutToken('employee'))
setupLoggingMiddleware(app)

app.use('/api/csp', csp)

function scheduledApiRouter() {
  const router = Router()
  router.all('*', (req, res) => res.sendStatus(404))
  return router
}

function internalApiRouter() {
  const router = Router()
  router.use('/scheduled', scheduledApiRouter())
  router.all('/system/*', (req, res) => res.sendStatus(404))

  router.all('/auth/*', (req: express.Request, res, next) => {
    if (req.session?.logoutToken?.idpProvider === 'evaka') {
      req.url = req.url.replace('saml', 'evaka')
    }
    next()
  })

  router.use(
    createSamlRouter({
      strategyName: 'ead',
      strategy: createEspooAdSamlStrategy(),
      sessionType: 'employee',
      pathIdentifier: 'saml'
    })
  )

  router.use(
    createSamlRouter({
      strategyName: 'evaka',
      strategy: createEvakaSamlStrategy(),
      sessionType: 'employee',
      pathIdentifier: 'evaka'
    })
  )

  if (enableDevApi) {
    router.use(
      '/dev-api',
      createProxy({ path: ({ path }) => `/dev-api${path}` })
    )
  }

  router.post('/auth/mobile', mobileDeviceSession)
  router.get(
    '/auth/status',
    refreshMobileSession,
    csrf,
    csrfCookie('employee'),
    authStatus
  )
  router.all('/public/*', createProxy())
  router.use(requireAuthentication)
  router.use(csrf)
  router.post('/attachments', createProxy({ multipart: true }))
  router.use(createProxy())
  return router
}

app.use('/api/internal', internalApiRouter())
app.use(errorHandler(true))

export default app
