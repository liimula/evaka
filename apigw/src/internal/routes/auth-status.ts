// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { toRequestHandler } from '../../shared/express'
import {
  getEmployeeDetails,
  getMobileDevice
} from '../../shared/service-client'
import { logoutExpress } from '../../shared/session'

export default toRequestHandler(async (req, res) => {
  const user = req.user
  if (user) {
    if (user.userType === 'MOBILE') {
      const device = await getMobileDevice(req, user.id)
      if (device) {
        const { id, name, unitId } = device
        res.status(200).json({
          loggedIn: true,
          user: { id, name, unitId },
          roles: user.roles
        })
      } else {
        // device has been removed
        await logoutExpress(req, res, 'employee')
        res.status(200).json({ loggedIn: false })
      }
    } else {
      const { id, firstName, lastName } = await getEmployeeDetails(req, user.id)
      const name = [firstName, lastName].filter((x) => !!x).join(' ')
      res.status(200).json({
        loggedIn: true,
        user: { id, name },
        roles: user.roles
      })
    }
  } else {
    res.status(200).json({ loggedIn: false })
  }
})
