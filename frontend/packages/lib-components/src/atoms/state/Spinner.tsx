// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React from 'react'
import styled from 'styled-components'
import { transparentize } from 'polished'
import colors from '../../colors'
import { defaultMargins, SpacingSize } from '../../white-space'

const spinnerSize = '50px'

const Spinner = styled.div`
  border-radius: 50%;
  width: ${spinnerSize};
  height: ${spinnerSize};

  border: 5px solid ${transparentize(0.8, colors.primary)};
  border-left-color: ${colors.primary};
  animation: spin 1.1s infinite linear;

  &:after {
    border-radius: 50%;
    width: ${spinnerSize};
    height: ${spinnerSize};
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`

interface SpinnerWrapperProps {
  size: string
}
const SpinnerWrapper = styled.div<SpinnerWrapperProps>`
  margin: ${(p) => p.size} 0;
  display: flex;
  justify-content: center;
  align-items: center;
`

interface SpinnerSegmentProps {
  size?: SpacingSize
}

export function SpinnerSegment({ size = 'm' }: SpinnerSegmentProps) {
  return (
    <SpinnerWrapper size={defaultMargins[size]}>
      <Spinner />
    </SpinnerWrapper>
  )
}

export default Spinner
