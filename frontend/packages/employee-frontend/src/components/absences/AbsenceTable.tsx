// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import classNames from 'classnames'
import LocalDate from '@evaka/lib-common/src/local-date'
import { Table } from '~components/shared/alpha'
import { Child, TableMode } from '~types/absence'
import { getRange, getWeekDay, getMonthDays } from './utils'
import AbsenceCellWrapper, { DisabledCell } from './AbsenceCell'
import StaffAttendance from './StaffAttendance'
import { AbsencesState, AbsencesContext } from '~state/absence'
import { Translations, useTranslation } from '~state/i18n'
import Tooltip from '~components/common/Tooltip'

interface AbsenceRowProps {
  child: Child
  dateCols: LocalDate[]
  emptyCols: number[]
  i18n: Translations
}

const shortChildName = (
  firstName: string,
  lastName: string,
  i18n: Translations
) => {
  const firstNames = firstName.split(/\s/)
  return lastName && firstName
    ? `${lastName}, ${firstNames[0]}`
    : i18n.common.noName
}

function getEmptyCols(dateColsLength: number, tableMode: TableMode): number[] {
  switch (tableMode) {
    case 'MONTH': {
      return getRange(31 - dateColsLength)
    }
  }
}

function AbsenceTableRow({
  child,
  dateCols,
  emptyCols,
  i18n
}: AbsenceRowProps) {
  const { id, placements, absences, backupCares } = child

  return (
    <Table.Row>
      <Table.Td className={'absence-child-name hover-highlight'}>
        <Tooltip
          tooltipId={`tooltip_absence-child-name-${child.id}`}
          tooltipText={`${child.lastName}, ${child.firstName}`}
          place={'top'}
          delayShow={750}
        >
          <Link
            to={`/child-information/${child.id}`}
            className={'absence-child-link'}
          >
            {shortChildName(child.firstName, child.lastName, i18n)}
          </Link>
        </Tooltip>
      </Table.Td>
      <Table.Td className={'hover-highlight'}>{child.dob.format()}</Table.Td>
      {dateCols.map((date) => {
        return (
          <Table.Td
            key={`${id}${date.formatIso()}`}
            className={`${
              date.isToday() ? 'absence-cell-today' : ''
            } hover-highlight`}
          >
            <AbsenceCellWrapper
              careTypes={placements[date.formatIso()]}
              absences={absences[date.formatIso()]}
              backupCare={backupCares[date.formatIso()]}
              date={date}
              childId={id}
            />
          </Table.Td>
        )
      })}
      {emptyCols.map((item) => (
        <Table.Td key={item}>
          <DisabledCell />
        </Table.Td>
      ))}
    </Table.Row>
  )
}

interface AbsenceHeadProps {
  dateCols: LocalDate[]
  emptyCols: number[]
}

function AbsenceTableHead({ dateCols, emptyCols }: AbsenceHeadProps) {
  const { i18n } = useTranslation()
  return (
    <Table.Head>
      <Table.Row>
        <Table.Th>{i18n.absences.table.nameCol}</Table.Th>
        <Table.Th>{i18n.absences.table.dobCol}</Table.Th>
        {dateCols.map((item) => (
          <Table.Th
            key={item.getDate()}
            align="center"
            className={classNames({
              'absence-header-today': item.isToday(),
              'absence-header-weekday': item.isWeekend()
            })}
          >
            <div>{getWeekDay(item)}</div>
            <div>{item.getDate()}</div>
          </Table.Th>
        ))}
        {emptyCols.map((item) => (
          <Table.Th key={item} />
        ))}
      </Table.Row>
    </Table.Head>
  )
}

interface AbsenceTableProps {
  groupId: string
  childList: Child[]
}

function AbsenceTable({ groupId, childList }: AbsenceTableProps) {
  const { i18n } = useTranslation()

  const { selectedDate, tableMode } = useContext<AbsencesState>(AbsencesContext)

  const dateColsBody =
    childList.length > 0
      ? Object.keys(childList[0].placements)
          .sort()
          .map((date) => LocalDate.parseIso(date))
      : []

  const dateColsHead =
    dateColsBody.length > 0 ? dateColsBody : getMonthDays(selectedDate)

  const emptyCols = getEmptyCols(dateColsHead.length, tableMode)

  const renderEmptyRow = () => (
    <Table.Row>
      <Table.Td className={'empty-row'}>.</Table.Td>
    </Table.Row>
  )

  return (
    <Table.Table>
      <AbsenceTableHead dateCols={dateColsHead} emptyCols={emptyCols} />
      <Table.Body>
        {childList.map((item) => (
          <AbsenceTableRow
            key={item.id}
            child={item}
            dateCols={dateColsBody}
            emptyCols={emptyCols}
            i18n={i18n}
          />
        ))}
        {renderEmptyRow()}
        <StaffAttendance groupId={groupId} emptyCols={emptyCols} />
      </Table.Body>
    </Table.Table>
  )
}

export default AbsenceTable