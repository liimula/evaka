// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

declare var global: any

declare module '*.vue' {
  import Vue from 'vue'
  export default Vue
}

declare module 'vuedraggable'