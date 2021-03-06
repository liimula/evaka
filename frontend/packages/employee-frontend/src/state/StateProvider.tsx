// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React from 'react'
import { ChildContextProvider } from '~/state/child'
import { PersonContextProvider } from '~/state/person'
import { CustomersContextProvider } from '~/state/customers'
import { UnitContextProvider } from '~/state/unit'
import { UnitsContextProvider } from '~/state/units'
import { UIContextProvider } from '~/state/ui'
import { I18nContextProvider } from '~/state/i18n'
import { InvoicingUIContextProvider } from '~/state/invoicing-ui'
import { AbsencesContextProvider } from '~/state/absence'
import { ApplicationUIContextProvider } from '~/state/application-ui'
import {
  PlacementDraftContextProvider,
  UnitsContextProvider as PDUnitsContextProvider
} from '~state/placementdraft'
import { DecisionDraftContextProvider } from '~state/decision'
import { TitleContextProvider } from '~state/title'
import { AttendanceUIContextProvider } from '~/state/attendance-ui'

const StateProvider = React.memo(function StateProvider({
  children
}: {
  children: JSX.Element
}) {
  return (
    <I18nContextProvider>
      <UIContextProvider>
        <UnitsContextProvider>
          <UnitContextProvider>
            <CustomersContextProvider>
              <PersonContextProvider>
                <ChildContextProvider>
                  <InvoicingUIContextProvider>
                    <AbsencesContextProvider>
                      <DecisionDraftContextProvider>
                        <PlacementDraftContextProvider>
                          <PDUnitsContextProvider>
                            <TitleContextProvider>
                              <ApplicationUIContextProvider>
                                <AttendanceUIContextProvider>
                                  {children}
                                </AttendanceUIContextProvider>
                              </ApplicationUIContextProvider>
                            </TitleContextProvider>
                          </PDUnitsContextProvider>
                        </PlacementDraftContextProvider>
                      </DecisionDraftContextProvider>
                    </AbsencesContextProvider>
                  </InvoicingUIContextProvider>
                </ChildContextProvider>
              </PersonContextProvider>
            </CustomersContextProvider>
          </UnitContextProvider>
        </UnitsContextProvider>
      </UIContextProvider>
    </I18nContextProvider>
  )
})

export default StateProvider
