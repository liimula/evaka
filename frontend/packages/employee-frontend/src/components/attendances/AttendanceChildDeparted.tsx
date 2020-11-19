// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later
import React, { Fragment, useContext } from 'react'
import { useHistory } from 'react-router-dom'

import {
  AttendanceChild,
  getDaycareAttendances,
  returnToPresent
} from '~api/attendances'
import InputField from '~components/shared/atoms/form/InputField'
import { FixedSpaceColumn } from '~components/shared/layout/flex-helpers'
import { AttendanceUIContext } from '~state/attendance-ui'
import { useTranslation } from '~state/i18n'
import { UUID } from '~types'
import { FlexLabel, getTimeString } from './AttendanceChildPage'
import { InlineWideAsyncButton } from './components'

interface Props {
  child: AttendanceChild
  unitId: UUID
  groupId: UUID | 'all'
}

export default React.memo(function AttendanceChildDeparted({
  child,
  unitId,
  groupId: groupIdOrAll
}: Props) {
  const history = useHistory()
  const { i18n } = useTranslation()

  const { filterAndSetAttendanceResponse } = useContext(AttendanceUIContext)

  function returnToPresentCall() {
    return returnToPresent(unitId, child.id)
  }

  return (
    <Fragment>
      <FixedSpaceColumn>
        <FlexLabel>
          <span>{i18n.attendances.arrivalTime}</span>
          <InputField
            onChange={undefined}
            value={
              child.attendance?.arrived
                ? getTimeString(child.attendance.arrived)
                : 'xx:xx'
            }
            width="s"
            type="time"
            data-qa="set-time"
            readonly
          />
        </FlexLabel>

        <FlexLabel>
          <span>{i18n.attendances.departureTime}</span>
          <InputField
            onChange={undefined}
            value={
              child.attendance?.departed
                ? getTimeString(child.attendance.departed)
                : 'xx:xx'
            }
            width="s"
            type="time"
            data-qa="set-time"
            readonly
          />
        </FlexLabel>

        <InlineWideAsyncButton
          text={i18n.attendances.actions.returnToPresent}
          onClick={() => returnToPresentCall()}
          onSuccess={async () => {
            await getDaycareAttendances(unitId).then((res) =>
              filterAndSetAttendanceResponse(res, groupIdOrAll)
            )
            history.goBack()
          }}
          data-qa="delete-attendance"
        />
      </FixedSpaceColumn>
    </Fragment>
  )
})
