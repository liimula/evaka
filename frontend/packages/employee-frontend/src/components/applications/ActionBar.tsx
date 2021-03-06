// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useContext, useState } from 'react'
import { ApplicationUIContext } from '~state/application-ui'
import Button from '@evaka/lib-components/src/atoms/buttons/Button'
import { useTranslation } from '~state/i18n'
import StickyActionBar from '~components/common/StickyActionBar'
import { UIContext } from '~state/ui'
import { CheckedRowsInfo } from '~components/common/CheckedRowsInfo'
import {
  batchCancelPlacementPlan,
  batchMoveToWaitingPlacement,
  batchReturnToSent,
  batchSendDecisionsWithoutProposal,
  batchSendPlacementProposal,
  batchWithdrawPlacementProposal
} from 'api/applications'
import { FixedSpaceRow } from '@evaka/lib-components/src/layout/flex-helpers'

type Action = {
  id: string
  label: string
  primary: boolean
  enabled: boolean
  disabled: boolean
  onClick: () => void
}

type Props = {
  reloadApplications: () => void
  fullWidth?: boolean
}

export default React.memo(function ActionBar({ reloadApplications }: Props) {
  const { i18n } = useTranslation()
  const { checkedIds, setCheckedIds, status } = useContext(ApplicationUIContext)
  const [actionInFlight, setActionInFlight] = useState(false)
  const { setErrorMessage } = useContext(UIContext)
  const clearApplicationList = () => {
    setCheckedIds([])
    reloadApplications()
  }

  const disabled = actionInFlight || checkedIds.length === 0
  const handlePromise = (promise: Promise<void>) => {
    void promise
      .then(() => void clearApplicationList())
      .catch(
        () =>
          void setErrorMessage({
            type: 'error',
            title: i18n.common.error.unknown
          })
      )
      .finally(() => void setActionInFlight(false))
  }

  const actions: Action[] = [
    {
      id: 'moveToWaitingPlacement',
      label: i18n.applications.actions.moveToWaitingPlacement,
      primary: true,
      enabled: status === 'SENT',
      disabled,
      onClick: () => handlePromise(batchMoveToWaitingPlacement(checkedIds))
    },
    {
      id: 'returnToSent',
      label: i18n.applications.actions.returnToSent,
      primary: false,
      enabled: status === 'WAITING_PLACEMENT',
      disabled,
      onClick: () => handlePromise(batchReturnToSent(checkedIds))
    },
    {
      id: 'cancelPlacementPlan',
      label: i18n.applications.actions.cancelPlacementPlan,
      primary: false,
      enabled: status === 'WAITING_DECISION',
      disabled,
      onClick: () => handlePromise(batchCancelPlacementPlan(checkedIds))
    },
    {
      id: 'sendDecisionsWithoutProposal',
      label: i18n.applications.actions.sendDecisionsWithoutProposal,
      primary: false,
      enabled: status === 'WAITING_DECISION',
      disabled,
      onClick: () =>
        handlePromise(batchSendDecisionsWithoutProposal(checkedIds))
    },
    {
      id: 'sendPlacementProposal',
      label: i18n.applications.actions.sendPlacementProposal,
      primary: true,
      enabled: status === 'WAITING_DECISION',
      disabled,
      onClick: () => handlePromise(batchSendPlacementProposal(checkedIds))
    },
    {
      id: 'withdrawPlacementProposal',
      label: i18n.applications.actions.withdrawPlacementProposal,
      primary: false,
      enabled: status === 'WAITING_UNIT_CONFIRMATION',
      disabled,
      onClick: () => handlePromise(batchWithdrawPlacementProposal(checkedIds))
    }
  ].filter(({ enabled }) => enabled)

  return actions.length > 0 ? (
    <StickyActionBar align={'right'}>
      {checkedIds.length > 0 ? (
        <CheckedRowsInfo>
          {i18n.applications.actions.checked(checkedIds.length)}
        </CheckedRowsInfo>
      ) : null}
      <FixedSpaceRow>
        {actions.map(({ id, label, disabled, onClick, primary }) => (
          <Button
            key={id}
            onClick={onClick}
            text={label}
            disabled={disabled}
            primary={primary}
            dataQa={`action-bar-${id}`}
          />
        ))}
      </FixedSpaceRow>
    </StickyActionBar>
  ) : null
})
