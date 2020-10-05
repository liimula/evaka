// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { Fragment, useContext, useMemo } from 'react'
import { RouteComponentProps } from 'react-router'
import { UUID } from '~types'
import { Container, ContentArea, Table, Title } from '~components/shared/alpha'
import PersonFridgePartner from '~components/person-profile/PersonFridgePartner'
import PersonFridgeChild from '~components/person-profile/PersonFridgeChild'
import PersonFridgeHead from '~components/person-profile/PersonFridgeHead'
import PersonIncome from '~components/person-profile/PersonIncome'
import PersonApplications from '~components/person-profile/PersonApplications'
import PersonDependants from '~components/person-profile/PersonDependants'
import PersonDecisions from '~components/person-profile/PersonDecisions'
import WarningLabel from '~components/common/WarningLabel'
import { getLayout, LayoutsWithDefault } from './layouts'
import '~components/PersonProfile.scss'
import { UserContext } from '~state/user'
import { PersonContext } from '~state/person'
import { isSuccess } from '~api'
import PersonFeeDecisions from '~components/person-profile/PersonFeeDecisions'
import PersonInvoices from '~components/person-profile/PersonInvoices'
import styled from 'styled-components'
import FamilyOverview from './person-profile/PersonFamilyOverview'
import { useTranslation } from '~state/i18n'
import CircularLabel from '~components/common/CircularLabel'

export const NameTd = styled(Table.Td)`
  width: 30%;
`

export const DateTd = styled(Table.Td)`
  width: 12%;
`

export const ButtonsTd = styled(Table.Td)`
  width: 13%;
`

export const StatusTd = styled(Table.Td)`
  width: 13%;
`

export const HeaderRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
`

export const InfoLabelContainer = styled.div`
  display: flex;
  div {
    margin: 5px;
  }
`

const components = {
  'family-overview': FamilyOverview,
  income: PersonIncome,
  'fee-decisions': PersonFeeDecisions,
  invoices: PersonInvoices,
  partners: PersonFridgePartner,
  'fridge-children': PersonFridgeChild,
  dependants: PersonDependants,
  applications: PersonApplications,
  decisions: PersonDecisions
}

const layouts: LayoutsWithDefault<typeof components> = {
  ['FINANCE_ADMIN']: [
    { component: 'family-overview', open: true },
    { component: 'income', open: true },
    { component: 'fee-decisions', open: false },
    { component: 'invoices', open: false },
    { component: 'partners', open: false },
    { component: 'fridge-children', open: false },
    { component: 'dependants', open: false },
    { component: 'applications', open: false },
    { component: 'decisions', open: false }
  ],
  ['ADMIN']: [
    { component: 'family-overview', open: true },
    { component: 'partners', open: false },
    { component: 'fridge-children', open: false },
    { component: 'dependants', open: false },
    { component: 'applications', open: false },
    { component: 'decisions', open: false },
    { component: 'income', open: true },
    { component: 'fee-decisions', open: false },
    { component: 'invoices', open: false }
  ],
  default: [
    { component: 'partners', open: false },
    { component: 'fridge-children', open: false },
    { component: 'dependants', open: false },
    { component: 'applications', open: false },
    { component: 'decisions', open: false }
  ]
}

const PersonProfile = React.memo(function PersonProfile({
  match
}: RouteComponentProps<{ id: UUID }>) {
  const { id } = match.params
  const { i18n } = useTranslation()

  const { roles } = useContext(UserContext)
  const { person } = useContext(PersonContext)

  const layout = useMemo(() => getLayout(layouts, roles), [roles])

  return (
    <Container>
      <ContentArea opaque>
        <div className="person-profile-wrapper" data-person-id={id}>
          <HeaderRow>
            <Title size={2}> {i18n.personProfile.title}</Title>
            <InfoLabelContainer>
              {isSuccess(person) && person.data.dateOfDeath && (
                <CircularLabel
                  text={`${
                    i18n.common.form.dateOfDeath
                  }: ${person.data.dateOfDeath.format()}`}
                  background={`black`}
                  color={`white`}
                  dataQa="deceaced-label"
                />
              )}
              {isSuccess(person) && person.data.restrictedDetailsEnabled && (
                <WarningLabel
                  text={i18n.personProfile.restrictedDetails}
                  dataQa="restriction-details-enabled-label"
                />
              )}
            </InfoLabelContainer>
          </HeaderRow>
          <div className="separator-gap-small" />
          <PersonFridgeHead id={id} />
          {layout.map(({ component, open }) => {
            const Component = components[component]
            return (
              <Fragment key={component}>
                <div className="separator-gap-small" />
                <Component id={id} open={open} />
              </Fragment>
            )
          })}
        </div>
      </ContentArea>
    </Container>
  )
})

export default PersonProfile