// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.shared.auth

import fi.espoo.evaka.PureJdbiTest
import fi.espoo.evaka.decision.DecisionType
import fi.espoo.evaka.shared.db.handle
import fi.espoo.evaka.shared.dev.DevCareArea
import fi.espoo.evaka.shared.dev.DevChild
import fi.espoo.evaka.shared.dev.DevDaycare
import fi.espoo.evaka.shared.dev.DevDaycareGroup
import fi.espoo.evaka.shared.dev.DevEmployee
import fi.espoo.evaka.shared.dev.DevPerson
import fi.espoo.evaka.shared.dev.TestDecision
import fi.espoo.evaka.shared.dev.insertTestApplication
import fi.espoo.evaka.shared.dev.insertTestCareArea
import fi.espoo.evaka.shared.dev.insertTestChild
import fi.espoo.evaka.shared.dev.insertTestDaycare
import fi.espoo.evaka.shared.dev.insertTestDaycareGroup
import fi.espoo.evaka.shared.dev.insertTestDecision
import fi.espoo.evaka.shared.dev.insertTestEmployee
import fi.espoo.evaka.shared.dev.insertTestPerson
import fi.espoo.evaka.shared.dev.insertTestPlacement
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.EnumSource
import java.time.LocalDate
import java.util.UUID

class AclIntegrationTest : PureJdbiTest() {
    private lateinit var employeeId: UUID
    private lateinit var daycareId: UUID
    private lateinit var groupId: UUID
    private lateinit var childId: UUID
    private lateinit var applicationId: UUID
    private lateinit var decisionId: UUID
    private lateinit var placementId: UUID

    private lateinit var acl: AccessControlList

    @BeforeAll
    fun before() {
        jdbi.handle {
            employeeId = it.insertTestEmployee(DevEmployee())
            val areaId = it.insertTestCareArea(DevCareArea(name = "Test area"))
            daycareId = it.insertTestDaycare(DevDaycare(areaId = areaId))
            groupId = it.insertTestDaycareGroup(DevDaycareGroup(daycareId = daycareId))
            childId = it.insertTestPerson(DevPerson())
            it.insertTestChild(DevChild(id = childId))
            applicationId = insertTestApplication(it, childId = childId)
            decisionId = it.insertTestDecision(
                TestDecision(
                    createdBy = employeeId,
                    unitId = daycareId,
                    applicationId = applicationId,
                    type = DecisionType.DAYCARE,
                    startDate = LocalDate.of(2019, 1, 1),
                    endDate = LocalDate.of(2100, 1, 1)
                )
            )
            placementId = insertTestPlacement(it, childId = childId, unitId = daycareId)
        }
        acl = AccessControlList(jdbi)
    }

    @BeforeEach
    fun beforeEach() {
        jdbi.handle { it.execute("TRUNCATE daycare_acl") }
    }

    @ParameterizedTest(name = "{0}")
    @EnumSource(names = ["ADMIN", "SERVICE_WORKER", "FINANCE_ADMIN"])
    fun testGlobalRoleAuthorization(role: UserRole) {
        val user = AuthenticatedUser(employeeId, setOf(role))
        val aclAuth = AclAuthorization.All
        val aclRoles = AclAppliedRoles(setOf(role))

        assertEquals(aclAuth, acl.getAuthorizedDaycares(user))
        assertEquals(aclAuth, acl.getAuthorizedUnits(user))

        assertEquals(aclRoles, acl.getRolesForUnit(user, daycareId))
        assertEquals(aclRoles, acl.getRolesForDecision(user, decisionId))
        assertEquals(aclRoles, acl.getRolesForPlacement(user, placementId))
        assertEquals(aclRoles, acl.getRolesForUnitGroup(user, groupId))
    }

    @ParameterizedTest(name = "{0}")
    @EnumSource(names = ["UNIT_SUPERVISOR", "STAFF"])
    fun testAclRoleAuthorization(role: UserRole) {
        val user = AuthenticatedUser(employeeId, setOf(role))
        val negativeAclAuth = AclAuthorization.Subset(emptySet())
        val negativeAclRoles = AclAppliedRoles(emptySet())
        val positiveAclAuth = AclAuthorization.Subset(setOf(daycareId))
        val positiveAclRoles = AclAppliedRoles(setOf(role))

        assertEquals(negativeAclAuth, acl.getAuthorizedDaycares(user))
        assertEquals(negativeAclAuth, acl.getAuthorizedUnits(user))
        assertEquals(negativeAclRoles, acl.getRolesForUnit(user, daycareId))
        assertEquals(negativeAclRoles, acl.getRolesForDecision(user, decisionId))
        assertEquals(negativeAclRoles, acl.getRolesForPlacement(user, placementId))
        assertEquals(negativeAclRoles, acl.getRolesForUnitGroup(user, groupId))

        jdbi.handle { it.insertDaycareAclRow(daycareId, employeeId, role) }

        assertEquals(positiveAclAuth, acl.getAuthorizedDaycares(user))
        assertEquals(positiveAclAuth, acl.getAuthorizedUnits(user))
        assertEquals(positiveAclRoles, acl.getRolesForUnit(user, daycareId))
        assertEquals(positiveAclRoles, acl.getRolesForDecision(user, decisionId))
        assertEquals(positiveAclRoles, acl.getRolesForPlacement(user, placementId))
        assertEquals(positiveAclRoles, acl.getRolesForUnitGroup(user, groupId))
    }
}
