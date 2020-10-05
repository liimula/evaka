// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { getUUID } from '@/utils/uuid'

export default {
  beforeCreate() {
    this.uuid = getUUID()
  }
}