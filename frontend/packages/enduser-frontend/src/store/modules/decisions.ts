// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import * as decisionsApi from '@/api/decisions'
import { Decision, DecisionStatus, DecisionType } from '@/api/decisions'
import * as types from '@/store/mutation-types'
import router from '@/router'
import _ from 'lodash'
import { Module } from 'vuex'
import { UUID } from '@/types'
import { RootState } from '@/store'

export interface DecisionsState {
  loading: boolean
  loaded: boolean
  decisions: Decision[]
}

const initialState: DecisionsState = {
  loading: false,
  loaded: false,
  decisions: []
}

export interface DecisionSummary {
  id: UUID
  childId: UUID
  status: DecisionStatus
  type: 'CLUB_DECISION' | DecisionType
  sentDate: Date
  resolved?: Date
}

export interface DecisionDetails extends DecisionSummary {
  applicationId: UUID
  startDate: Date
  endDate: Date
  requestedStartDate: Date
  firstName: string
  lastName: string
  unit: string
}

const module: Module<DecisionsState, RootState> = {
  state: initialState,
  getters: {
    decisionsLoaded: (state) => state.loaded && !state.loading,
    decisions: (state) => state.decisions,
    decisionSummaries: (state, getters, rootState): DecisionSummary[] =>
      state.decisions.map((decision) => {
        const application = rootState.applications.applications.find(
          ({ id }) => decision.applicationId === id
        )
        return {
          id: decision.id,
          childId: application && application.child.id,
          type: decision.type,
          status: decision.status,
          sentDate: decision.sentDate,
          resolved: decision.resolved
        }
      }),
    decisionDetailsById: (state, getters, rootState) => (
      decisionId
    ): DecisionDetails | undefined => {
      const decision = state.decisions.find((d) => d.id === decisionId)
      if (!decision) {
        return undefined
      }
      const application = rootState.applications.applications.find(
        ({ id }) => decision.applicationId === id
      )
      if (!application) {
        return undefined
      }

      return {
        id: decision.id,
        childId: application.child.id,
        type: decision.type,
        status: decision.status,
        sentDate: decision.sentDate,
        applicationId: decision.applicationId,
        unit: decision.unit,
        firstName: application.child.firstName,
        lastName: application.child.lastName,
        startDate: decision.startDate,
        endDate: decision.endDate,
        requestedStartDate: decision.requestedStartDate || decision.startDate,
        resolved: decision.resolved
      }
    }
  },
  actions: {
    async loadDecisions({ commit }) {
      commit(types.START_LOADING_DECISIONS)
      const decisions = await decisionsApi.getDecisions()
      commit(types.LOAD_DECISIONS, decisions)
    },
    viewDecision({ commit, state, dispatch }, decisionId) {
      router.push('/decisions/' + decisionId)
    },
    viewDecisions() {
      router.push('/decisions')
    }
  },
  mutations: {
    [types.START_LOADING_DECISIONS](state) {
      state.loading = true
    },
    [types.LOAD_DECISIONS](state, decisions) {
      state.decisions = decisions || []
      state.loading = false
      state.loaded = true
    }
  }
}
export default module