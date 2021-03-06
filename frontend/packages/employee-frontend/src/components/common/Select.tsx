// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { memo } from 'react'
import styled from 'styled-components'
import ReactSelect, { StylesConfig, ValueType } from 'react-select'

export interface SelectOptionProps {
  value: string
  label: string
}

export interface SelectProps {
  className?: string
  disabled?: boolean
  id?: string
  name?: string
  onChange?: (option: ValueType<SelectOptionProps>) => void
  onFocus?: () => void
  options: SelectOptionProps[]
  placeholder?: string
  'data-qa'?: string
  value?: ValueType<SelectOptionProps>
}

interface ContainerProps {
  fullWidth?: boolean
}

const Container = styled.div<ContainerProps>`
  position: relative;
  ${(p) => (p.fullWidth ? 'width: 100%;' : '')}
  min-width: 150px;

  select {
    padding-right: 20px;
  }
`

type SelectComponentProps = SelectProps & ContainerProps

const Select = memo(function Select({
  className,
  fullWidth,
  disabled,
  id,
  name,
  onChange,
  onFocus,
  options,
  placeholder,
  'data-qa': dataQa,
  value
}: SelectComponentProps) {
  return (
    <Container fullWidth={fullWidth} data-qa={dataQa} className={className}>
      <ReactSelect
        isDisabled={disabled}
        id={id}
        name={name}
        options={options}
        placeholder={placeholder}
        onChange={onChange}
        onFocus={onFocus}
        value={value}
        styles={reactSelectStyles}
      />
    </Container>
  )
})

export const reactSelectStyles: StylesConfig = {
  menu: (styles) => {
    return {
      ...styles,
      zIndex: 4
    }
  }
}

export default Select
