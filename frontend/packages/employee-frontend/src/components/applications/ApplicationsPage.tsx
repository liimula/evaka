// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useCallback, useEffect, useState, useContext } from 'react'
import { Result } from '~/api'
import { getApplications } from '~api/applications'
import {
  ApplicationsSearchResponse,
  ApplicationSearchParams
} from '~types/application'
import { useRestApi } from '~utils/useRestApi'
import { SortByApplications } from '~/types/application'
import { SearchOrder } from '~/types'
import { defaultMargins, Gap } from '@evaka/lib-components/src/white-space'
import {
  Container,
  ContentArea
} from '@evaka/lib-components/src/layout/Container'
import ApplicationsList from 'components/applications/ApplicationsList'
import ApplicationFilters from './ApplicationsFilters'
import { ApplicationUIContext } from '~state/application-ui'
import { H1 } from '@evaka/lib-components/src/typography'
import ErrorSegment from '@evaka/lib-components/src/atoms/state/ErrorSegment'
import { SpinnerSegment } from '@evaka/lib-components/src/atoms/state/Spinner'
import styled from 'styled-components'
import { useTranslation } from '~state/i18n'

const PaddedDiv = styled.div`
  padding: ${defaultMargins.m} ${defaultMargins.L};
`

const pageSize = 50

function ApplicationsPage() {
  const { i18n } = useTranslation()
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState<SortByApplications>('APPLICATION_TYPE')
  const [sortDirection, setSortDirection] = useState<SearchOrder>('ASC')

  const {
    applicationsResult,
    setApplicationsResult,
    area,
    units,
    basis,
    type,
    preschoolType,
    status,
    allStatuses,
    dateType,
    distinctions,
    transferApplications,
    startDate,
    endDate,
    debouncedSearchTerms,
    setCheckedIds
  } = useContext(ApplicationUIContext)

  const onApplicationsResponse = useCallback(
    (result: Result<ApplicationsSearchResponse>) => {
      setApplicationsResult(result)

      // ensure current page is within range
      if (result.isSuccess && result.value.pages < page) {
        setPage(result.value.pages)
      }
    },
    [setApplicationsResult]
  )

  const reloadApplications = useRestApi(getApplications, onApplicationsResponse)

  const loadApplications = useCallback(() => {
    const params: ApplicationSearchParams = {
      area: area.includes('All')
        ? undefined
        : area.length > 0
        ? area.join(',')
        : undefined,
      units: units.length > 0 ? units.join(',') : undefined,
      basis: basis.length > 0 ? basis.join(',') : undefined,
      type: type,
      preschoolType:
        type === 'PRESCHOOL' && preschoolType.length > 0
          ? preschoolType.join(',')
          : undefined,
      status:
        status === 'ALL'
          ? allStatuses.length > 0
            ? allStatuses.join(',')
            : undefined
          : status,
      dateType: dateType.length > 0 ? dateType.join(',') : undefined,
      distinctions:
        distinctions.length > 0 ? distinctions.join(',') : undefined,
      periodStart:
        startDate && dateType.length > 0 ? startDate.formatIso() : undefined,
      periodEnd:
        endDate && dateType.length > 0 ? endDate.formatIso() : undefined,
      searchTerms: debouncedSearchTerms,
      transferApplications
    }

    reloadApplications(page, pageSize, sortBy, sortDirection, params)
  }, [
    page,
    pageSize,
    sortBy,
    sortDirection,
    area,
    units,
    basis,
    type,
    preschoolType,
    status,
    allStatuses,
    dateType,
    distinctions,
    transferApplications,
    startDate,
    endDate,
    debouncedSearchTerms,
    reloadApplications
  ])

  useEffect(() => {
    loadApplications()
  }, [loadApplications])

  // when changing filters, sorting, etc, set page to 1 and reload
  useEffect(() => {
    setPage(1)
    setCheckedIds([])
  }, [
    setPage,
    area,
    units,
    basis,
    type,
    preschoolType,
    status,
    allStatuses,
    dateType,
    distinctions,
    startDate,
    endDate,
    debouncedSearchTerms
  ])

  return (
    <div data-qa="applications-page">
      <Container>
        <Gap size={'L'} />
        <ContentArea opaque>
          <ApplicationFilters />
        </ContentArea>
        <Gap size={'XL'} />
        <ContentArea opaque paddingVertical={'zero'} paddingHorozontal={'zero'}>
          {applicationsResult.isFailure && (
            <PaddedDiv>
              <H1>
                {status === 'ALL'
                  ? i18n.applications.list.title
                  : i18n.application.statuses[status]}
              </H1>
              <ErrorSegment />
            </PaddedDiv>
          )}

          {applicationsResult.isLoading && (
            <PaddedDiv>
              <H1>
                {status === 'ALL'
                  ? i18n.applications.list.title
                  : i18n.application.statuses[status]}
              </H1>
              <SpinnerSegment data-qa="applications-spinner" />
            </PaddedDiv>
          )}

          {applicationsResult.isSuccess && (
            <ApplicationsList
              applicationsResult={applicationsResult.value}
              reloadApplications={loadApplications}
              currentPage={page}
              setPage={setPage}
              sortBy={sortBy}
              setSortBy={setSortBy}
              sortDirection={sortDirection}
              setSortDirection={setSortDirection}
            />
          )}
        </ContentArea>
      </Container>
    </div>
  )
}

export default ApplicationsPage
