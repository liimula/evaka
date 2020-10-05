// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { Dispatch, SetStateAction } from 'react'
import styled from 'styled-components'
import { Table } from '~components/shared/alpha'
import Select from '~components/common/Select'
import EuroInput from '~components/common/EuroInput'
import { TableIncomeState } from '../IncomeTable'
import { Translations } from '~state/i18n'
import {
  incomeCoefficients,
  incomeSubTypes,
  IncomeCoefficient,
  IncomeType
} from '~types/income'
import { formatCents, parseCents } from '~utils/money'

type TypeLabelProps = { indent: boolean }

const TypeLabel = styled.span<TypeLabelProps>`
  margin-left: ${(props) => (props.indent ? '2rem' : '0')};
`

const MonthlyValue = styled.span`
  font-style: italic;
`

const typesWithCoefficients: IncomeType[] = [
  'MAIN_INCOME',
  'SECONDARY_INCOME',
  'OTHER_INCOME'
]

const coefficientMultipliers = {
  MONTHLY_WITH_HOLIDAY_BONUS: 1.0417,
  MONTHLY_NO_HOLIDAY_BONUS: 1,
  BI_WEEKLY_WITH_HOLIDAY_BONUS: 2.2323,
  BI_WEEKLY_NO_HOLIDAY_BONUS: 2.1429,
  YEARLY: 0.0833
}

const calculateMonthlyAmount = (
  amount: string,
  coefficient: IncomeCoefficient
) => {
  const parsed = parseCents(amount)
  return parsed ? Math.round(parsed * coefficientMultipliers[coefficient]) : 0
}

type Props = {
  i18n: Translations
  type: IncomeType
  editing: boolean
  amount: string
  coefficient: IncomeCoefficient
  monthlyAmount: number
  updateData: Dispatch<SetStateAction<TableIncomeState>>
}

const IncomeTableRow = React.memo(function IncomeTableRow({
  i18n,
  type,
  editing,
  amount,
  coefficient,
  monthlyAmount,
  updateData
}: Props) {
  const coefficientOptions = incomeCoefficients.map((id) => ({
    id,
    label: i18n.personProfile.income.details.incomeCoefficients[id]
  }))

  return (
    <Table.Row key={type}>
      <Table.Td>
        <TypeLabel indent={incomeSubTypes.includes(type)}>
          {i18n.personProfile.income.details.incomeTypes[type]}
        </TypeLabel>
      </Table.Td>
      <Table.Td align="right">
        {editing ? (
          <EuroInput
            value={amount}
            onChange={(amount) =>
              updateData((prev) => ({
                ...prev,
                [type]: {
                  amount,
                  coefficient:
                    prev[type]?.coefficient ?? 'MONTHLY_NO_HOLIDAY_BONUS',
                  monthlyAmount: undefined
                }
              }))
            }
            allowEmpty
            dataQa={`income-input-${type}`}
          />
        ) : (
          <span>{amount} €</span>
        )}
      </Table.Td>
      <Table.Td>
        {typesWithCoefficients.includes(type) ? (
          editing ? (
            <Select
              value={coefficient}
              options={coefficientOptions}
              onChange={(e) => {
                updateData((prev) => ({
                  ...prev,
                  [type]: {
                    amount: prev[type]?.amount ?? '',
                    coefficient: e.target.value,
                    monthlyAmount: undefined
                  }
                }))
              }}
              dataQa={`income-coefficient-select-${type}`}
            />
          ) : (
            <span>
              {coefficient
                ? i18n.personProfile.income.details.incomeCoefficients[
                    coefficient
                  ]
                : ''}
            </span>
          )
        ) : undefined}
      </Table.Td>
      <Table.Td align="right">
        <MonthlyValue>
          {`${
            formatCents(
              monthlyAmount || calculateMonthlyAmount(amount, coefficient)
            ) ?? ''
          } €`}
        </MonthlyValue>
      </Table.Td>
    </Table.Row>
  )
})

export default IncomeTableRow