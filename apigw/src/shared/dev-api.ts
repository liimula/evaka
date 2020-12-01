// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { client, UserRole, UUID } from './service-client'

interface DevEmployee {
  firstName: string
  lastName: string
  email: string
  aad: UUID
  roles: UserRole[]
}

export async function upsertEmployee(employee: DevEmployee): Promise<UUID> {
  const { data } = await client.post(
    `/dev-api/employee/aad/${employee.aad}`,
    employee
  )
  return data
}