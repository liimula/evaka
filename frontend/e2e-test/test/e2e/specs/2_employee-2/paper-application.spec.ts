// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import EmployeeHome from '../../pages/employee/home'
import config from '../../config'
import {
  initializeAreaAndPersonData,
  AreaAndPersonFixtures
} from '../../dev-api/data-init'
import { supervisor } from '../../dev-api/fixtures'
import { daycareGroupFixture } from '../../dev-api/fixtures'
import { logConsoleMessages } from '../../utils/fixture'
import { t } from 'testcafe'
import {
  deleteEmployeeById,
  deleteEmployeeFixture,
  insertDaycareGroupFixtures,
  insertEmployeeFixture
} from '../../dev-api'
import { seppoAdminRole } from '../../config/users'
import ChildInformationPage from '../../pages/employee/child-information/child-information-page'
import ApplicationEditView from '../../pages/employee/applications/application-edit-view'
import { ApplicationPersonDetail } from '../../dev-api/types'

const employeeHome = new EmployeeHome()
const childInforationPage = new ChildInformationPage()
const applicationEditPage = new ApplicationEditView()

let fixtures: AreaAndPersonFixtures
let cleanUp: () => Promise<void>
let supervisorId: string

fixture('Employee - paper application')
  .meta({ type: 'regression', subType: 'paperapplication' })
  .page(employeeHome.url)
  .before(async () => {
    ;[fixtures, cleanUp] = await initializeAreaAndPersonData()
    await insertDaycareGroupFixtures([daycareGroupFixture])
    supervisorId = await insertEmployeeFixture(supervisor)
  })
  .beforeEach(async () => {
    await t.useRole(seppoAdminRole)
    await employeeHome.navigateToChildInformation(
      fixtures.enduserChildFixtureJari.id
    )
  })
  .afterEach(logConsoleMessages)
  .after(async () => {
    await cleanUp()
    await deleteEmployeeFixture(config.supervisorExternalId)
    await deleteEmployeeById(supervisorId)
  })

const formatPersonName = (person: ApplicationPersonDetail) =>
  `${person.lastName} ${person.firstName}`

const formatPersonAddress = ({
  streetAddress,
  postalCode,
  postOffice
}: ApplicationPersonDetail) =>
  `${streetAddress ?? ''}, ${postalCode ?? ''} ${postOffice ?? ''}`

test('Paper application can be created for guardian and child with ssn', async () => {
  await childInforationPage.openCreateApplicationModal()
  await childInforationPage.clickCreateApplicationModalCreateApplicationButton()
  await applicationEditPage.assertApplicationGuardian(
    formatPersonName(fixtures.enduserGuardianFixture),
    fixtures.enduserGuardianFixture.ssn,
    formatPersonAddress(fixtures.enduserGuardianFixture)
  )
})

test('Paper application can be created for other guardian and child with ssn', async () => {
  await childInforationPage.openCreateApplicationModal()
  await childInforationPage.selectGuardian(1)
  await childInforationPage.clickCreateApplicationModalCreateApplicationButton()
  await applicationEditPage.assertApplicationGuardian(
    formatPersonName(fixtures.enduserChildJariOtherGuardianFixture),
    fixtures.enduserChildJariOtherGuardianFixture.ssn,
    formatPersonAddress(fixtures.enduserChildJariOtherGuardianFixture)
  )
})

test('Paper application can be created for other non guardian vtj person and child with ssn', async () => {
  await childInforationPage.openCreateApplicationModal()
  await childInforationPage.selectVtjPersonAsGuardian(
    '270372-905L',
    'Korhonen-Hämäläinen'
  ) // From service mock-vtj-data.json
  await childInforationPage.clickCreateApplicationModalCreateApplicationButton()
  await applicationEditPage.assertApplicationGuardian(
    'Korhonen-Hämäläinen Sirkka-Liisa Marja-Leena Minna-Mari Anna-Kaisa',
    '270372-905L',
    'Kamreerintie 2, 00370 Espoo'
  )
})

test('Paper application can be created with new guardian person', async () => {
  await childInforationPage.openCreateApplicationModal()
  await childInforationPage.selectCreateNewPersonAsGuardian(
    'Testi',
    'Testinen',
    '01.11.1980',
    'Katuosoite A1',
    '02200',
    'Espoo',
    '123456789',
    'testi.testinen@test.com'
  )
  await childInforationPage.clickCreateApplicationModalCreateApplicationButton()
  await applicationEditPage.assertApplicationGuardian(
    'Testinen Testi',
    '',
    'Katuosoite A1, 02200 Espoo'
  )
})

test('Service worker fills paper application with minimal info and saves it', async (t) => {
  await childInforationPage.openCreateApplicationModal()
  await childInforationPage.clickCreateApplicationModalCreateApplicationButton()
  await applicationEditPage.fillStartDate(new Date())
  await applicationEditPage.fillTimes()
  await applicationEditPage.pickUnit(fixtures.daycareFixture.name)
  await applicationEditPage.fillApplicantPhoneAndEmail(
    '123456',
    'email@test.com'
  )
  await applicationEditPage.saveApplication()
  await t.expect(applicationEditPage.readView.exists).ok()
})

test('Service worker fills paper application with second guardian contact info and agreement status', async (t) => {
  await childInforationPage.openCreateApplicationModal()
  await childInforationPage.clickCreateApplicationModalCreateApplicationButton()
  await applicationEditPage.fillStartDate(new Date())
  await applicationEditPage.fillTimes()
  await applicationEditPage.pickUnit(fixtures.daycareFixture.name)
  await applicationEditPage.fillApplicantPhoneAndEmail(
    '123456',
    'email@test.com'
  )
  await applicationEditPage.fillSecondGuardianContactInfo(
    '654321',
    'second-email@test.com'
  )
  await applicationEditPage.setGuardianAgreementStatus('AGREED')
  await applicationEditPage.saveApplication()
  await t.expect(applicationEditPage.readView.exists).ok()
})
