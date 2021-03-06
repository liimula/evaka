// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React from 'react'
import styled from 'styled-components'
import { H4, Label } from '@evaka/lib-components/src/typography'
import { Address, ApplicationResponse, PersonBasics } from 'types/application'
import CollapsibleSection from '@evaka/lib-components/src/molecules/CollapsibleSection'
import {
  faChild,
  faFileAlt,
  faInfo,
  faMapMarkerAlt,
  faUserFriends,
  faUsers
} from '@evaka/lib-icons'
import { Gap } from '@evaka/lib-components/src/white-space'
import { formatName } from 'utils'
import { useTranslation } from 'state/i18n'
import ListGrid from '@evaka/lib-components/src/layout/ListGrid'
import { Link } from 'react-router-dom'
import { formatParagraphs } from 'utils/html-utils'
import { FixedSpaceColumn } from '@evaka/lib-components/src/layout/flex-helpers'
import ApplicationTitle from 'components/application-page/ApplicationTitle'
import VTJGuardian from 'components/application-page/VTJGuardian'
import ApplicationStatusSection from 'components/application-page/ApplicationStatusSection'
import ApplicationDecisionsSection from 'components/application-page/ApplicationDecisionsSection'
import colors from '@evaka/lib-components/src/colors'
import Attachment from '~components/common/Attachment'

function YesNoValue({ value }: { value: boolean | null | undefined }) {
  const { i18n } = useTranslation()

  return <span>{value ? i18n.common.yes : i18n.common.no}</span>
}

const Dimmed = styled.span`
  color: ${colors.greyscale.medium};
`

const AttachmentContainer = styled.div`
  display: flex;
  flex-direction: column;
  & > div {
    margin-top: 5px;
    margin-bottom: 5px;
  }
`

function BooleanValue({
  value,
  selectedLabel
}: {
  value: boolean
  selectedLabel: string
}) {
  const { i18n } = useTranslation()

  return value ? (
    <span>{selectedLabel}</span>
  ) : (
    <Dimmed>{i18n.common.no}</Dimmed>
  )
}

interface PreschoolApplicationProps {
  application: ApplicationResponse
  reloadApplication: () => void
}

function ApplicationReadView({
  application,
  reloadApplication
}: PreschoolApplicationProps) {
  const { i18n } = useTranslation()

  const {
    application: {
      type,
      form: {
        child,
        guardian,
        secondGuardian,
        otherPartner,
        otherChildren,
        preferences: {
          preferredUnits,
          preferredStartDate,
          urgent,
          serviceNeed,
          siblingBasis,
          preparatory
        },
        otherInfo,
        maxFeeAccepted,
        clubDetails
      },
      childId,
      guardianId,
      childRestricted,
      guardianRestricted
    },
    decisions,
    guardians,
    attachments
  } = application

  const urgencyAttachments = attachments.filter(
    ({ type }) => type === 'URGENCY'
  )
  const extendedCareAttachments = attachments.filter(
    ({ type }) => type === 'EXTENDED_CARE'
  )

  const connectedDaycare = type === 'PRESCHOOL' && serviceNeed !== null
  const paid = type === 'DAYCARE' || connectedDaycare

  const formatPersonName = (person: PersonBasics) =>
    formatName(person.firstName, person.lastName, i18n, true)
  const formatAddress = (a: Address) =>
    `${a.street}, ${a.postalCode} ${a.postOffice}`

  const applicationGuardian = guardians.find(
    (guardian) => guardian.id === application.application.guardianId
  )
  const otherGuardian = guardians.find(
    (guardian) => guardian.id !== application.application.guardianId
  )
  const otherGuardianLivesInSameAddress =
    (applicationGuardian &&
      otherGuardian &&
      applicationGuardian.residenceCode != null &&
      applicationGuardian.residenceCode === otherGuardian.residenceCode) ||
    false

  return (
    <div data-qa="application-read-view">
      <ApplicationTitle application={application.application} />
      <Gap />

      <CollapsibleSection
        title={i18n.application.serviceNeed.title}
        icon={faFileAlt}
      >
        <ListGrid>
          <Label>{i18n.application.serviceNeed.startDate}</Label>
          <span>{preferredStartDate ? preferredStartDate.format() : ''}</span>

          {type === 'DAYCARE' && (
            <>
              <Label>{i18n.application.serviceNeed.urgentLabel}</Label>
              {!urgent ? (
                <span>{i18n.application.serviceNeed.notUrgent}</span>
              ) : (
                <AttachmentContainer>
                  {urgencyAttachments.length ? (
                    <span>
                      {i18n.application.serviceNeed.isUrgentWithAttachments}
                    </span>
                  ) : (
                    <span>{i18n.application.serviceNeed.isUrgent}</span>
                  )}
                  {urgencyAttachments.map((attachment) => (
                    <Attachment
                      key={attachment.id}
                      attachment={attachment}
                      dataQa={`urgent-attachment-${attachment.name}`}
                    />
                  ))}
                </AttachmentContainer>
              )}

              {serviceNeed !== null && (
                <>
                  <Label>{i18n.application.serviceNeed.partTimeLabel}</Label>
                  {serviceNeed.partTime ? (
                    <span>{i18n.application.serviceNeed.partTime}</span>
                  ) : (
                    <span>{i18n.application.serviceNeed.fullTime}</span>
                  )}
                </>
              )}
            </>
          )}

          {type === 'PRESCHOOL' && (
            <>
              <Label>{i18n.application.serviceNeed.connectedLabel}</Label>
              <BooleanValue
                value={serviceNeed !== null}
                selectedLabel={i18n.application.serviceNeed.connectedValue}
              />
            </>
          )}

          {serviceNeed !== null && (
            <>
              <Label>{i18n.application.serviceNeed.dailyTime}</Label>
              <span>
                {serviceNeed.startTime} - {serviceNeed.endTime}
              </span>

              <Label>{i18n.application.serviceNeed.shiftCareLabel}</Label>
              {!serviceNeed.shiftCare ? (
                <span>{i18n.common.no}</span>
              ) : (
                <AttachmentContainer>
                  {extendedCareAttachments.length ? (
                    <span>
                      {i18n.application.serviceNeed.shiftCareWithAttachments}
                    </span>
                  ) : (
                    <span>{i18n.application.serviceNeed.shiftCareValue}</span>
                  )}
                  {extendedCareAttachments.map((attachment) => (
                    <Attachment
                      key={attachment.id}
                      attachment={attachment}
                      dataQa={`extended-care-attachment-${attachment.name}`}
                    />
                  ))}
                </AttachmentContainer>
              )}
            </>
          )}

          {type === 'CLUB' && (
            <>
              <Label>{i18n.application.clubDetails.wasOnClubCareLabel}</Label>
              <BooleanValue
                value={!!clubDetails?.wasOnClubCare}
                selectedLabel={i18n.application.clubDetails.wasOnClubCareValue}
              />
              <Label>{i18n.application.clubDetails.wasOnDaycareLabel}</Label>
              <BooleanValue
                value={!!clubDetails?.wasOnDaycare}
                selectedLabel={i18n.application.clubDetails.wasOnDaycareValue}
              />
            </>
          )}

          {type === 'PRESCHOOL' && (
            <>
              <Label>{i18n.application.serviceNeed.preparatoryLabel}</Label>
              <BooleanValue
                value={preparatory}
                selectedLabel={i18n.application.serviceNeed.preparatoryValue}
              />
            </>
          )}

          <Label>{i18n.application.serviceNeed.assistanceLabel}</Label>
          <BooleanValue
            value={child.assistanceNeeded}
            selectedLabel={i18n.application.serviceNeed.assistanceValue}
          />

          {child.assistanceNeeded && (
            <>
              <Label>{i18n.application.serviceNeed.assistanceDesc}</Label>
              <div>{formatParagraphs(child.assistanceDescription)}</div>
            </>
          )}
        </ListGrid>
      </CollapsibleSection>

      <CollapsibleSection
        title={i18n.application.preferences.title}
        icon={faMapMarkerAlt}
      >
        <ListGrid>
          <Label>{i18n.application.preferences.preferredUnits}</Label>
          {preferredUnits.map((unit, i) => (
            <React.Fragment key={unit.id}>
              {i > 0 && <Label />}
              <Link to={`/units/${unit.id}`}>{`${i + 1}. ${unit.name}`}</Link>
            </React.Fragment>
          ))}
        </ListGrid>
        <Gap size="s" />
        <ListGrid>
          <Label>{i18n.application.preferences.siblingBasisLabel}</Label>
          <BooleanValue
            value={siblingBasis !== null}
            selectedLabel={i18n.application.preferences.siblingBasisValue}
          />
          {siblingBasis !== null && (
            <>
              <Label>{i18n.application.preferences.siblingName}</Label>
              <span>{siblingBasis.siblingName}</span>
              <Label>{i18n.application.preferences.siblingSsn}</Label>
              <span>{siblingBasis.siblingSsn}</span>
            </>
          )}
        </ListGrid>
      </CollapsibleSection>

      <CollapsibleSection title={i18n.application.child.title} icon={faChild}>
        <ListGrid>
          <Label>{i18n.application.person.name}</Label>
          <Link to={`/child-information/${childId}`}>
            {formatPersonName(child.person)}
          </Link>

          <Label>{i18n.application.person.ssn}</Label>
          <span>{child.person.socialSecurityNumber}</span>

          {!child.person.socialSecurityNumber && (
            <>
              <Label>{i18n.application.person.dob}</Label>
              <span>{child.dateOfBirth?.format()}</span>
            </>
          )}

          {childRestricted ? (
            <>
              <Label>{i18n.application.person.address}</Label>
              <span>{i18n.application.person.restricted}</span>
            </>
          ) : (
            <>
              <Label>{i18n.application.person.address}</Label>
              <span>{child.address && formatAddress(child.address)}</span>
              {child.futureAddress && (
                <>
                  <Label>{i18n.application.person.futureAddress}</Label>
                  <span>{formatAddress(child.futureAddress)}</span>
                  <Label>{i18n.application.person.movingDate}</Label>
                  <span>{child.futureAddress.movingDate?.format() ?? ''}</span>
                </>
              )}
            </>
          )}

          <Label>{i18n.application.person.nationality}</Label>
          <span>{child.nationality}</span>
          <Label>{i18n.application.person.language}</Label>
          <span>{child.language}</span>
        </ListGrid>
      </CollapsibleSection>

      <CollapsibleSection
        title={i18n.application.guardians.title}
        icon={faUserFriends}
      >
        <FixedSpaceColumn spacing="L">
          <div>
            <H4>{i18n.application.guardians.appliedGuardian}</H4>
            <ListGrid>
              <Label>{i18n.application.person.name}</Label>
              <Link to={`/profile/${guardianId}`} data-qa="guardian-name">
                {formatPersonName(guardian.person)}
              </Link>
              <Label>{i18n.application.person.ssn}</Label>
              <span>{guardian.person.socialSecurityNumber}</span>

              {guardianRestricted ? (
                <>
                  <Label>{i18n.application.person.address}</Label>
                  <span>{i18n.application.person.restricted}</span>
                </>
              ) : (
                <>
                  <Label>{i18n.application.person.address}</Label>
                  <span>
                    {guardian.address && formatAddress(guardian.address)}
                  </span>
                  {guardian.futureAddress && (
                    <>
                      <Label>{i18n.application.person.futureAddress}</Label>
                      <span>{formatAddress(guardian.futureAddress)}</span>
                      <Label>{i18n.application.person.movingDate}</Label>
                      <span>
                        {guardian.futureAddress.movingDate?.format() ?? ''}
                      </span>
                    </>
                  )}
                </>
              )}

              <Label>{i18n.application.person.phone}</Label>
              <span>{guardian.phoneNumber}</span>
              <Label>{i18n.application.person.email}</Label>
              <span>{guardian.email}</span>
            </ListGrid>
          </div>

          {type !== 'CLUB' && (
            <div>
              <H4>{i18n.application.guardians.secondGuardian.title}</H4>

              <ListGrid>
                {secondGuardian && (
                  <>
                    <Label>{i18n.application.person.phone}</Label>
                    <span data-qa="second-guardian-phone">
                      {secondGuardian.phoneNumber}
                    </span>
                    <Label>{i18n.application.person.email}</Label>
                    <span data-qa="second-guardian-email">
                      {secondGuardian.email}
                    </span>
                    <Label data-qa="agreement-status-label">
                      {i18n.application.person.agreementStatus}
                    </Label>
                    <span data-qa="agreement-status">
                      {
                        i18n.application.person.otherGuardianAgreementStatuses[
                          secondGuardian.agreementStatus || 'NOT_SET'
                        ]
                      }
                    </span>
                  </>
                )}
              </ListGrid>
            </div>
          )}

          <VTJGuardian
            guardianId={otherGuardian?.id}
            otherGuardianLivesInSameAddress={otherGuardianLivesInSameAddress}
          />
        </FixedSpaceColumn>
      </CollapsibleSection>

      {paid && (
        <>
          <CollapsibleSection
            title={i18n.application.otherPeople.title}
            icon={faUsers}
          >
            <FixedSpaceColumn spacing="L">
              {(!otherGuardian || !otherGuardianLivesInSameAddress) && (
                <div>
                  <H4>{i18n.application.otherPeople.adult}</H4>
                  <ListGrid>
                    <Label>{i18n.application.otherPeople.spouse}</Label>
                    <YesNoValue value={otherPartner !== null} />

                    {otherPartner && (
                      <>
                        <Label>{i18n.application.person.name}</Label>
                        <span>{formatPersonName(otherPartner)}</span>
                        <Label>{i18n.application.person.ssn}</Label>
                        <span>{otherPartner.socialSecurityNumber}</span>
                      </>
                    )}
                  </ListGrid>
                </div>
              )}

              <div>
                <H4>{i18n.application.otherPeople.children}</H4>
                {otherChildren.length > 0 ? (
                  <FixedSpaceColumn>
                    {otherChildren.map((otherChild, i) => (
                      <ListGrid
                        key={`${i}:${otherChild.firstName}:${otherChild.socialSecurityNumber}`}
                      >
                        <Label>{i18n.application.person.name}</Label>
                        <span>{formatPersonName(otherChild)}</span>
                        <Label>{i18n.application.person.ssn}</Label>
                        <span>{otherChild.socialSecurityNumber}</span>
                      </ListGrid>
                    ))}
                  </FixedSpaceColumn>
                ) : (
                  <span>{i18n.application.person.noOtherChildren}</span>
                )}
              </div>
            </FixedSpaceColumn>
          </CollapsibleSection>
        </>
      )}

      <CollapsibleSection
        title={i18n.application.additionalInfo.title}
        icon={faInfo}
      >
        <ListGrid>
          <Label>{i18n.application.additionalInfo.applicationInfo}</Label>
          <div>{formatParagraphs(otherInfo)}</div>

          {type !== 'CLUB' && (
            <>
              <Label>{i18n.application.additionalInfo.allergies}</Label>
              <span>{child.allergies}</span>

              <Label>{i18n.application.additionalInfo.diet}</Label>
              <span>{child.diet}</span>

              <Label>{i18n.application.additionalInfo.maxFeeAccepted}</Label>
              <span>{maxFeeAccepted ? i18n.common.yes : i18n.common.no}</span>
            </>
          )}
        </ListGrid>
      </CollapsibleSection>

      <ApplicationDecisionsSection
        applicationId={application.application.id}
        decisions={decisions}
        preferredStartDate={
          application.application.form.preferences.preferredStartDate
        }
        reloadApplication={reloadApplication}
      />

      <ApplicationStatusSection application={application.application} />
    </div>
  )
}

export default ApplicationReadView
