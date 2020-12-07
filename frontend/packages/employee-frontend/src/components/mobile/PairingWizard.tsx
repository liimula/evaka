// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { Fragment, useEffect } from 'react'
import { useState } from 'react'
import MetaTags from 'react-meta-tags'
import styled from 'styled-components'

import { Result, Loading, isSuccess, isFailure } from '~api'
import {
  authMobile,
  getPairingStatus,
  PairingResponse,
  postPairingChallenge
} from '~api/unit'
import IconButton from '~components/shared/atoms/buttons/IconButton'
import InputField from '~components/shared/atoms/form/InputField'
import Colors from '~components/shared/Colors'
import { P } from '~components/shared/Typography'
import { faArrowRight } from '~icon-set'
import { useTranslation } from '~state/i18n'
import EvakaLogo from '../../assets/EvakaLogo.svg'
import { FullHeightContainer } from './components'

export const WideLinkButton = styled.a`
  min-height: 45px;
  outline: none;
  cursor: pointer;
  font-family: 'Open Sans', sans-serif;
  font-size: 14px;
  line-height: 16px;
  font-weight: 600;
  text-transform: uppercase;
  white-space: nowrap;
  letter-spacing: 0.2px;
  width: 100%;
  color: ${Colors.greyscale.white};
  background: ${Colors.blues.primary};
  display: flex;
  justify-content: center;
  align-items: center;
`

const CenteredColumn = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
`

const Flex = styled.div`
  display: flex;
  align-items: center;
`

const Img = styled.img`
  max-width: 50%;
`

const PhaseTitle = styled.h1`
  font-family: Montserrat, sans-serif;
  font-style: normal;
  font-weight: 600;
  font-size: 20px;
  line-height: 30px;
  text-align: center;
  color: ${Colors.blues.dark};
`

export const ResponseKey = styled.div`
  font-family: Montserrat, sans-serif;
  font-style: normal;
  font-weight: 600;
  font-size: 30px;
  line-height: 30px;
  text-align: center;
  letter-spacing: 0.08em;
  color: ${Colors.greyscale.dark};
`

const Bottom = styled.div``

export default React.memo(function ParingWizard() {
  const { i18n } = useTranslation()

  const [phase, setPhase] = useState<1 | 2 | 3>(1)
  const [challengeKey, setChallengeKey] = useState<string>('')
  const [pairingResponse, setPairingResponse] = useState<
    Result<PairingResponse>
  >(Loading())

  useEffect(() => {
    const polling = setInterval(() => {
      if (isSuccess(pairingResponse)) {
        void getPairingStatus(pairingResponse.data.id).then((status) => {
          if (isSuccess(status)) {
            if (status.data.status === 'READY') {
              if (pairingResponse.data.responseKey) {
                void authMobile(
                  pairingResponse.data.id,
                  pairingResponse.data.challengeKey,
                  pairingResponse.data.responseKey
                )
              }

              clearInterval(polling)
              setPhase(3)
            }
          }
        })
      }
    }, 1000)
    return () => clearInterval(polling)
  }, [pairingResponse])

  async function sendRequest() {
    await postPairingChallenge(challengeKey).then(setPairingResponse)
    setPhase(2)
  }

  return (
    <Fragment>
      <MetaTags>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </MetaTags>

      <FullHeightContainer>
        {phase === 1 && (
          <Fragment>
            <CenteredColumn>
              <Img src={EvakaLogo} />
              <PhaseTitle data-qa="mobile-pairing-wizard-title-1">
                {i18n.mobile.wizard.title1}
              </PhaseTitle>
              <section>
                <P centered>{i18n.mobile.wizard.text1}</P>
              </section>
              <Flex>
                <InputField
                  value={challengeKey}
                  onChange={setChallengeKey}
                  placeholder={i18n.common.code}
                  data-qa="challenge-key-input"
                />
                <IconButton
                  icon={faArrowRight}
                  onClick={sendRequest}
                  data-qa="submit-challenge-key-btn"
                />
              </Flex>
            </CenteredColumn>
          </Fragment>
        )}

        {phase === 2 && isSuccess(pairingResponse) ? (
          <Fragment>
            <CenteredColumn>
              <Img src={EvakaLogo} />
              <PhaseTitle>{i18n.mobile.wizard.title2}</PhaseTitle>
              <section>
                <P centered>{i18n.mobile.wizard.text2}</P>
              </section>
              <ResponseKey data-qa="response-key">
                {pairingResponse.data.responseKey}
              </ResponseKey>
            </CenteredColumn>
          </Fragment>
        ) : (
          phase === 2 &&
          isFailure(pairingResponse) && <div>{i18n.common.loadingFailed}</div>
        )}

        {phase === 3 && isSuccess(pairingResponse) && (
          <FullHeightContainer spaced>
            <CenteredColumn>
              <Img src={EvakaLogo} />
              <PhaseTitle data-qa="mobile-pairing-wizard-title-3">
                {i18n.mobile.wizard.title3}
              </PhaseTitle>
              <section>
                <P centered>{i18n.mobile.wizard.text3}</P>
                <P centered>{i18n.mobile.wizard.text4}</P>
              </section>
            </CenteredColumn>
            <Bottom>
              <WideLinkButton
                href={`/employee/units/${pairingResponse.data.unitId}/groupselector`}
                data-qa="unit-page-link"
              >
                {i18n.mobile.actions.START.toUpperCase()}
              </WideLinkButton>
            </Bottom>
          </FullHeightContainer>
        )}
      </FullHeightContainer>
    </Fragment>
  )
})