// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React from 'react'
import styled from 'styled-components'
import classNames from 'classnames'
import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import colors, { greyscale } from '../../colors'
import { BaseProps } from '../../utils'
import { IconSize } from '../RoundIcon'

interface ButtonProps {
  size: IconSize | undefined
  gray?: boolean
}

const StyledButton = styled.button<ButtonProps>`
  display: flex;
  justify-content: center;
  align-items: center;
  width: ${(props: ButtonProps) => {
    switch (props.size) {
      case 's':
        return '20px'
      case 'm':
        return '24px'
      case 'L':
        return '34px'
      case 'XL':
        return '64px'
      default:
        return '20px'
    }
  }};
  height: ${(props: ButtonProps) => {
    switch (props.size) {
      case 's':
        return '20px'
      case 'm':
        return '24px'
      case 'L':
        return '34px'
      case 'XL':
        return '64px'
      default:
        return '20px'
    }
  }};
  font-size: ${(props: ButtonProps) => {
    switch (props.size) {
      case 's':
        return '20px'
      case 'm':
        return '24px'
      case 'L':
        return '34px'
      case 'XL':
        return '64px'
      default:
        return '20px'
    }
  }};
  color: ${(props) => (props.gray ? colors.greyscale.dark : colors.primary)};
  border: none;
  background: none;
  outline: none;
  padding: 0;
  margin: 0;
  cursor: pointer;

  &:hover {
    color: ${(props) =>
      props.gray ? colors.greyscale.dark : colors.primaryHover};
  }

  &:active {
    color: ${(props) =>
      props.gray ? colors.greyscale.darkest : colors.primaryActive};
  }

  &.disabled {
    color: ${greyscale.medium};
    cursor: not-allowed;
  }
`

interface IconButtonProps extends BaseProps {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  icon: IconDefinition
  altText?: string
  disabled?: boolean
  size?: IconSize
  gray?: boolean
  'data-qa'?: string
}

function IconButton({
  className,
  dataQa,
  icon,
  altText,
  onClick,
  disabled,
  size,
  gray,
  'data-qa': dataQa2
}: IconButtonProps) {
  return (
    <StyledButton
      className={classNames(className, { disabled })}
      data-qa={dataQa2 ?? dataQa}
      onClick={onClick}
      disabled={disabled}
      aria-label={altText}
      size={size}
      gray={gray}
    >
      <FontAwesomeIcon icon={icon} />
    </StyledButton>
  )
}

export default IconButton
