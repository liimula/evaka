// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useEffect, useMemo, useState } from 'react'
import ReactSelect from 'react-select'
import styled from 'styled-components'
import { Link } from 'react-router-dom'

import {
  Container,
  ContentArea
} from '@evaka/lib-components/src/layout/Container'
import Loader from '@evaka/lib-components/src/atoms/Loader'
import Title from '@evaka/lib-components/src/atoms/Title'
import {
  Th,
  Tr,
  Td,
  Thead,
  Tbody
} from '@evaka/lib-components/src/layout/Table'
import { reactSelectStyles } from '~components/common/Select'
import { useTranslation } from '~state/i18n'
import { Loading, Result } from '~api'
import ReturnButton from '@evaka/lib-components/src/atoms/buttons/ReturnButton'
import ReportDownload from '~components/reports/ReportDownload'
import { ChildrenInDifferentAddressReportRow } from '~types/reports'
import { getChildrenInDifferentAddressReport } from '~api/reports'
import {
  FilterLabel,
  FilterRow,
  RowCountInfo,
  TableScrollable
} from 'components/reports/common'
import { distinct } from 'utils'

interface DisplayFilters {
  careArea: string
}

const emptyDisplayFilters: DisplayFilters = {
  careArea: ''
}

const Wrapper = styled.div`
  width: 100%;
`

function ChildrenInDifferentAddress() {
  const { i18n } = useTranslation()
  const [rows, setRows] = useState<
    Result<ChildrenInDifferentAddressReportRow[]>
  >(Loading.of())

  const [displayFilters, setDisplayFilters] = useState<DisplayFilters>(
    emptyDisplayFilters
  )
  const displayFilter = (row: ChildrenInDifferentAddressReportRow): boolean => {
    return !(
      displayFilters.careArea && row.careAreaName !== displayFilters.careArea
    )
  }

  useEffect(() => {
    setRows(Loading.of())
    setDisplayFilters(emptyDisplayFilters)
    void getChildrenInDifferentAddressReport().then(setRows)
  }, [])

  const filteredRows: ChildrenInDifferentAddressReportRow[] = useMemo(
    () => rows.map((rs) => rs.filter(displayFilter)).getOrElse([]),
    [rows, displayFilters]
  )

  return (
    <Container>
      <ReturnButton label={i18n.common.goBack} />
      <ContentArea opaque>
        <Title size={1}>{i18n.reports.childrenInDifferentAddress.title}</Title>

        <FilterRow>
          <FilterLabel>{i18n.reports.common.careAreaName}</FilterLabel>
          <Wrapper>
            <ReactSelect
              options={[
                { value: '', label: i18n.common.all },
                ...rows
                  .map((rs) =>
                    distinct(rs.map((row) => row.careAreaName)).map((s) => ({
                      value: s,
                      label: s
                    }))
                  )
                  .getOrElse([])
              ]}
              onChange={(option) =>
                option && 'value' in option
                  ? setDisplayFilters({
                      ...displayFilters,
                      careArea: option.value
                    })
                  : {
                      label: i18n.common.all,
                      value: ''
                    }
              }
              value={
                displayFilters.careArea !== ''
                  ? {
                      label: displayFilters.careArea,
                      value: displayFilters.careArea
                    }
                  : undefined
              }
              styles={reactSelectStyles}
              placeholder={i18n.reports.occupancies.filters.areaPlaceholder}
            />
          </Wrapper>
        </FilterRow>

        {rows.isLoading && <Loader />}
        {rows.isFailure && <span>{i18n.common.loadingFailed}</span>}
        {rows.isSuccess && (
          <>
            <ReportDownload
              data={filteredRows}
              headers={[
                { label: 'Palvelualue', key: 'careAreaName' },
                { label: 'Yksikön nimi', key: 'unitName' },
                { label: 'Päämiehen sukunimi', key: 'firstNameParent' },
                { label: 'Päämiehen etunimi', key: 'lastNameParent' },
                { label: 'Päämiehen osoite', key: 'addressParent' },
                { label: 'Lapsen sukunimi', key: 'firstNameChild' },
                { label: 'Lapsen etunimi', key: 'lastNameChild' },
                { label: 'Lapsen osoite', key: 'addressChild' }
              ]}
              filename="Lapset eri osoitteissa.csv"
            />
            <TableScrollable>
              <Thead>
                <Tr>
                  <Th>{i18n.reports.common.careAreaName}</Th>
                  <Th>{i18n.reports.common.unitName}</Th>
                  <Th>{i18n.reports.childrenInDifferentAddress.person1}</Th>
                  <Th>{i18n.reports.childrenInDifferentAddress.address1}</Th>
                  <Th>{i18n.reports.childrenInDifferentAddress.person2}</Th>
                  <Th>{i18n.reports.childrenInDifferentAddress.address2}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredRows.map(
                  (row: ChildrenInDifferentAddressReportRow) => (
                    <Tr key={`${row.unitId}:${row.parentId}:${row.childId}`}>
                      <Td>{row.careAreaName}</Td>
                      <Td>
                        <Link to={`/units/${row.unitId}`}>{row.unitName}</Link>
                      </Td>
                      <Td>
                        <Link to={`/profile/${row.parentId}`}>
                          {row.lastNameParent} {row.firstNameParent}
                        </Link>
                      </Td>
                      <Td>{row.addressParent}</Td>
                      <Td>
                        <Link to={`/child-information/${row.childId}`}>
                          {row.lastNameChild} {row.firstNameChild}
                        </Link>
                      </Td>
                      <Td>{row.addressChild}</Td>
                    </Tr>
                  )
                )}
              </Tbody>
            </TableScrollable>
            <RowCountInfo rowCount={filteredRows.length} />
          </>
        )}
      </ContentArea>
    </Container>
  )
}

export default ChildrenInDifferentAddress
