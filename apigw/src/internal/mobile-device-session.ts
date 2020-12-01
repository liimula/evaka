// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import express from 'express'
import {
  assertStringProp,
  toMiddleware,
  toRequestHandler
} from '../shared/express'
import {
  UUID,
  validateMobileDevice,
  validatePairing
} from '../shared/service-client'
import { useSecureCookies } from '../shared/config'
import { fromCallback } from '../shared/promise-utils'

export const mobileLongTermCookieName = 'evaka.employee.mobile'

function daysToMillis(days: number): number {
  return days * 24 * 60 * 60_000
}

async function mobileLogin(
  req: express.Request,
  res: express.Response,
  deviceId: UUID
) {
  await fromCallback((cb) =>
    req.logIn(
      {
        id: deviceId,
        roles: [],
        userType: 'MOBILE'
      },
      cb
    )
  )
  // Unconditionally refresh long-term cookie on each login to refresh expiry
  // time and make it a "rolling" cookie
  res.cookie(mobileLongTermCookieName, deviceId, {
    maxAge: daysToMillis(90),
    httpOnly: true,
    secure: useSecureCookies,
    sameSite: 'lax',
    signed: true
  })
}

export const refreshMobileSession = toMiddleware(async (req, res) => {
  if (!req.user) {
    const deviceId = req.signedCookies[mobileLongTermCookieName]
    if (deviceId) {
      await validateMobileDevice(req, deviceId)
      await mobileLogin(req, res, deviceId)
    }
  }
})

export default toRequestHandler(async (req, res) => {
  const id = assertStringProp(req.body, 'id')
  const challengeKey = assertStringProp(req.body, 'challengeKey')
  const responseKey = assertStringProp(req.body, 'responseKey')
  const deviceId = await validatePairing(req, id, { challengeKey, responseKey })
  await mobileLogin(req, res, deviceId)
  res.sendStatus(204)
})