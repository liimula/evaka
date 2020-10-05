// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useCallback, useContext, useEffect } from 'react'
import { RouteComponentProps } from 'react-router'
import { flatMap, partition } from 'lodash'

import {
  Container,
  ContentArea,
  Radio,
  Checkbox,
  Loader,
  RadioGroup,
  Title
} from '~components/shared/alpha'

import { isSuccess, isLoading, isFailure, Loading } from '~api'
import FormModal from '~components/common/FormModal'
import { getGroupAbsences, postGroupAbsences } from '~api/absences'
import { AbsencesContext, AbsencesState } from '~state/absence'
import { useTranslation } from '~state/i18n'
import {
  AbsencePayload,
  defaultAbsenceType,
  AbsenceTypes,
  CareTypeCategories,
  CareTypeCategory,
  billableCareTypes,
  CellPart,
  defaultCareTypeCategory
} from '~types/absence'

import AbsenceTable from './AbsenceTable'

import './Absences.scss'
import PeriodPicker, {
  PeriodPickerMode
} from '~components/absences/PeriodPicker'
import { TitleContext, TitleState } from '~state/title'
import ColorInfo from '~components/absences/ColorInfo'
import ReturnButton from 'components/shared/atoms/buttons/ReturnButton'

function Absences({ match }: RouteComponentProps<{ groupId: string }>) {
  const { i18n } = useTranslation()
  const {
    absences,
    setAbsences,
    modalVisible,
    setModalVisible,
    selectedDate,
    setSelectedDate,
    selectedCells,
    setSelectedCells,
    selectedAbsenceType,
    setSelectedAbsenceType,
    selectedCareTypeCategories,
    setSelectedCareTypeCategories
  } = useContext<AbsencesState>(AbsencesContext)
  const { setTitle } = useContext<TitleState>(TitleContext)

  const { groupId } = match.params

  const resetModalState = () => {
    setSelectedCells([])
    setSelectedCareTypeCategories([])
    setSelectedAbsenceType(defaultAbsenceType)
    setSelectedCareTypeCategories(defaultCareTypeCategory)
    setModalVisible(false)
  }

  const loadAbsences = useCallback(() => {
    setAbsences(Loading())
    void getGroupAbsences(groupId, {
      year: selectedDate.getYear(),
      month: selectedDate.getMonth()
    }).then(setAbsences)
  }, [groupId, selectedDate])

  useEffect(() => {
    loadAbsences()
    return () => {
      setAbsences(Loading())
    }
  }, [loadAbsences])

  useEffect(() => {
    if (isSuccess(absences)) {
      setTitle(`${absences.data.groupName} | ${absences.data.daycareName}`)
    }
  }, [absences])

  function updateCareTypes(type: CareTypeCategory) {
    const included = selectedCareTypeCategories.includes(type)
    const without = selectedCareTypeCategories.filter((item) => item !== type)
    setSelectedCareTypeCategories(included ? without : [type, ...without])
  }

  function updateAbsences() {
    const selectedParts: CellPart[] = flatMap(
      selectedCells,
      ({ parts }) => parts
    )
    const [billableParts, otherParts] = partition(selectedParts, (part) =>
      billableCareTypes.includes(part.careType)
    )

    const data: AbsencePayload[] = flatMap(
      selectedCareTypeCategories,
      (careTypeCategory) => {
        return careTypeCategory === 'BILLABLE' ? billableParts : otherParts
      }
    ).map(({ childId, date, careType }) => {
      return {
        childId,
        date,
        absenceType: selectedAbsenceType,
        careType
      }
    })

    postGroupAbsences(groupId, data)
      .then(loadAbsences)
      .catch((e) => console.error(e))
      .finally(() => {
        resetModalState()
      })
  }

  const showModal = () => modalVisible && selectedCells.length > 0

  const renderAbsenceModal = () =>
    showModal() ? (
      <FormModal
        title=""
        className="absence-modal"
        resolveLabel={i18n.absences.modal.saveButton}
        rejectLabel={i18n.absences.modal.cancelButton}
        reject={() => {
          resetModalState()
        }}
        resolveDisabled={selectedCareTypeCategories.length === 0}
        resolve={() => {
          updateAbsences()
        }}
        size="lg"
      >
        <div>
          <RadioGroup label={i18n.absences.modal.absenceSectionLabel}>
            {AbsenceTypes.map((absenceType, index) => (
              <Radio
                key={index}
                id={absenceType}
                label={i18n.absences.modal.absenceTypes[absenceType]}
                value={absenceType}
                model={selectedAbsenceType}
                onChange={() => setSelectedAbsenceType(absenceType)}
              />
            ))}
          </RadioGroup>

          <RadioGroup label={i18n.absences.modal.placementSectionLabel}>
            {CareTypeCategories.map((careTypeCategory, index) => (
              <Checkbox
                key={index}
                label={i18n.absences.careTypeCategories[careTypeCategory]}
                name={careTypeCategory}
                checked={selectedCareTypeCategories.includes(careTypeCategory)}
                onChange={() => updateCareTypes(careTypeCategory)}
                dataQa={`absences-select-caretype-${careTypeCategory}`}
              />
            ))}
          </RadioGroup>
        </div>
      </FormModal>
    ) : null

  return (
    <div className="absences-page" data-qa="absences-page">
      <Container>
        <ReturnButton dataQa="absences-page-return-button" />
        <ContentArea opaque>
          {renderAbsenceModal()}
          {isSuccess(absences) ? (
            <div>
              <Title size={2} dataQa="absences-title">
                {absences.data.daycareName}
              </Title>
              <Title size={3}>{absences.data.groupName}</Title>
              <PeriodPicker
                mode={PeriodPickerMode.MONTH}
                onChange={setSelectedDate}
                date={selectedDate}
              />
              <AbsenceTable
                groupId={groupId}
                childList={absences.data.children}
              />
              <button
                className="button"
                data-qa="add-absences-button"
                onClick={() => setModalVisible(true)}
                disabled={selectedCells.length === 0}
              >
                {i18n.absences.addAbsencesButton(selectedCells.length)}
              </button>
            </div>
          ) : null}
          {isLoading(absences) && <Loader />}
          {isFailure(absences) && (
            <div>Something went wrong ({absences.error.message})</div>
          )}
        </ContentArea>
        <ColorInfo />
      </Container>
    </div>
  )
}

export default Absences