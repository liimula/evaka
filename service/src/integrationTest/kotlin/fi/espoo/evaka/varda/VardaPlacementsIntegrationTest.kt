// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.varda

import fi.espoo.evaka.FullApplicationTest
import fi.espoo.evaka.decision.DecisionType
import fi.espoo.evaka.insertGeneralTestFixtures
import fi.espoo.evaka.placement.PlacementType
import fi.espoo.evaka.placement.PlacementType.DAYCARE
import fi.espoo.evaka.resetDatabase
import fi.espoo.evaka.shared.db.handle
import fi.espoo.evaka.shared.db.transaction
import fi.espoo.evaka.shared.dev.insertTestPlacement
import fi.espoo.evaka.shared.domain.ClosedPeriod
import fi.espoo.evaka.testChild_1
import fi.espoo.evaka.testDaycare
import org.jdbi.v3.core.Handle
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

class VardaPlacementsIntegrationTest : FullApplicationTest() {
    @BeforeEach
    fun beforeEach() {
        jdbi.handle(::insertGeneralTestFixtures)
    }

    @AfterEach
    fun afterEach() {
        jdbi.handle(::resetDatabase)
    }

    @Test
    fun `a daycare placement is sent when the corresponding decision has been sent`() {
        jdbi.handle { h ->
            val period = ClosedPeriod(LocalDate.of(2019, 8, 1), LocalDate.of(2020, 7, 31))
            insertVardaUnit(h)
            val decisionId = insertDecisionWithApplication(h, testChild_1, period)
            val vardaDecisionId = insertTestVardaDecision(h, decisionId = decisionId)
            val placementId = insertPlacement(h, testChild_1.id, period)

            updatePlacements(h, vardaClient)

            val result = getVardaPlacements(h)
            assertEquals(1, result.size)
            assertEquals(placementId, result.first().evakaPlacementId)
            assertEquals(vardaDecisionId, result.first().decisionId)
        }
    }

    @Test
    fun `a daycare placement is not sent when the corresponding varda decision is missing`() {
        jdbi.handle { h ->
            val period = ClosedPeriod(LocalDate.of(2019, 8, 1), LocalDate.of(2020, 7, 31))
            insertVardaUnit(h)
            insertDecisionWithApplication(h, testChild_1, period)
            insertPlacement(h, testChild_1.id, period)

            updatePlacements(h, vardaClient)

            val result = getVardaPlacements(h)
            assertEquals(0, result.size)
        }
    }

    @Test
    fun `a daycare placement is not sent when the corresponding varda unit is missing`() {
        jdbi.handle { h ->
            val period = ClosedPeriod(LocalDate.of(2019, 8, 1), LocalDate.of(2020, 7, 31))
            val decisionId = insertDecisionWithApplication(h, testChild_1, period)
            insertTestVardaDecision(h, decisionId = decisionId)
            insertPlacement(h, testChild_1.id, period)

            updatePlacements(h, vardaClient)

            val result = getVardaPlacements(h)
            assertEquals(0, result.size)
        }
    }

    @Test
    fun `a daycare placement is not sent when starts in the future`() {
        jdbi.handle { h ->
            val period = ClosedPeriod(LocalDate.now().plusMonths(1), LocalDate.now().plusYears(1))
            insertVardaUnit(h)
            val decisionId = insertDecisionWithApplication(h, testChild_1, period)
            insertTestVardaDecision(h, decisionId = decisionId)
            insertPlacement(h, testChild_1.id, period)

            updatePlacements(h, vardaClient)

            val result = getVardaPlacements(h)
            assertEquals(0, result.size)
        }
    }

    @Test
    fun `a preschool placement is not sent`() {
        jdbi.handle { h ->
            val period = ClosedPeriod(LocalDate.of(2019, 8, 1), LocalDate.of(2020, 7, 31))
            insertVardaUnit(h)
            val decisionId =
                insertDecisionWithApplication(h, testChild_1, period, decisionType = DecisionType.PRESCHOOL_DAYCARE)
            insertTestVardaDecision(h, decisionId = decisionId)
            insertPlacement(h, testChild_1.id, period, type = PlacementType.PRESCHOOL)

            updatePlacements(h, vardaClient)

            val result = getVardaPlacements(h)
            assertEquals(0, result.size)
        }
    }

    @Test
    fun `a preschool daycare placement is not sent`() {
        jdbi.handle { h ->
            val period = ClosedPeriod(LocalDate.of(2019, 8, 1), LocalDate.of(2020, 7, 31))
            insertVardaUnit(h)
            val decisionId =
                insertDecisionWithApplication(h, testChild_1, period, decisionType = DecisionType.PRESCHOOL_DAYCARE)
            val vardaDecisionId = insertTestVardaDecision(h, decisionId = decisionId)
            val placementId = insertPlacement(h, testChild_1.id, period, type = PlacementType.PRESCHOOL_DAYCARE)

            updatePlacements(h, vardaClient)

            val result = getVardaPlacements(h)
            assertEquals(1, result.size)
            assertEquals(placementId, result.first().evakaPlacementId)
            assertEquals(vardaDecisionId, result.first().decisionId)
        }
    }

    @Test
    fun `multiple daycare placements are all sent`() {
        jdbi.handle { h ->
            val period = ClosedPeriod(LocalDate.of(2019, 8, 1), LocalDate.of(2020, 7, 31))
            insertVardaUnit(h)
            val decisionId = insertDecisionWithApplication(h, testChild_1, period)
            val vardaDecisionId = insertTestVardaDecision(h, decisionId = decisionId)
            val placementId1 = insertPlacement(h, testChild_1.id, period.copy(end = period.start.plusDays(5)))
            val placementId2 = insertPlacement(
                h,
                testChild_1.id,
                period.copy(start = period.start.plusDays(6), end = period.start.plusDays(10))
            )
            val placementId3 = insertPlacement(h, testChild_1.id, period.copy(start = period.start.plusDays(11)))

            updatePlacements(h, vardaClient)

            val result = getVardaPlacements(h)
            assertEquals(3, result.size)
            assertTrue(result.any { p -> p.evakaPlacementId == placementId1 })
            assertTrue(result.any { p -> p.evakaPlacementId == placementId2 })
            assertTrue(result.any { p -> p.evakaPlacementId == placementId3 })
            assertTrue(result.all { p -> p.decisionId == vardaDecisionId })
        }
    }

    @Test
    fun `varda placement is deleted when the original placement is deleted`() {
        jdbi.handle { h ->
            val period = ClosedPeriod(LocalDate.of(2019, 8, 1), LocalDate.of(2020, 7, 31))
            insertVardaUnit(h)
            val decisionId = insertDecisionWithApplication(h, testChild_1, period)
            insertTestVardaDecision(h, decisionId = decisionId)
            insertPlacement(h, testChild_1.id, period)

            updatePlacements(h, vardaClient)

            val beforeDelete = getVardaPlacements(h)
            assertEquals(1, beforeDelete.size)

            h.createUpdate("DELETE FROM placement").execute()
            updatePlacements(h, vardaClient)

            val result = getVardaPlacements(h)
            assertEquals(0, result.size)
        }
    }

    @Test
    fun `varda placement is deleted when the original placement is deleted with multiple placements`() {
        jdbi.handle { h ->
            val period = ClosedPeriod(LocalDate.of(2019, 8, 1), LocalDate.of(2020, 7, 31))
            insertVardaUnit(h)
            val decisionId = insertDecisionWithApplication(h, testChild_1, period)
            insertTestVardaDecision(h, decisionId = decisionId)
            val placementId = insertPlacement(h, testChild_1.id, period.copy(end = period.start.plusDays(5)))
            insertPlacement(
                h,
                testChild_1.id,
                period.copy(start = period.start.plusDays(6), end = period.start.plusDays(10))
            )
            insertPlacement(h, testChild_1.id, period.copy(start = period.start.plusDays(11)))

            updatePlacements(h, vardaClient)

            val beforeDelete = getVardaPlacements(h)
            assertEquals(3, beforeDelete.size)

            h.createUpdate("DELETE FROM placement WHERE id = :id").bind("id", placementId).execute()
            updatePlacements(h, vardaClient)

            val result = getVardaPlacements(h)
            assertEquals(2, result.size)
            assertTrue(result.none { it.evakaPlacementId == placementId })
        }
    }

    @Test
    fun `varda placement is updated when a placement is updated`() {
        jdbi.handle { h ->
            val period = ClosedPeriod(LocalDate.of(2019, 8, 1), LocalDate.of(2020, 7, 31))
            insertVardaUnit(h)
            val decisionId = insertDecisionWithApplication(h, testChild_1, period)
            insertTestVardaDecision(h, decisionId = decisionId)
            val placementId = insertPlacement(h, testChild_1.id, period)

            updatePlacements(h, vardaClient)
            val originalUploadedAt = getVardaPlacements(h).first().uploadedAt

            updatePlacement(h, placementId, originalUploadedAt.plusSeconds(1))
            updatePlacements(h, vardaClient)

            val result = getVardaPlacements(h)
            assertEquals(1, result.size)
            assertTrue(originalUploadedAt < result.first().uploadedAt)
        }
    }

    @Test
    fun `a daycare placement is sent when a varda decision has been derived from it`() {
        jdbi.handle { h ->
            val period = ClosedPeriod(LocalDate.of(2019, 8, 1), LocalDate.of(2020, 7, 31))
            insertVardaUnit(h)
            val placementId = insertPlacement(h, testChild_1.id, period)
            insertTestVardaDecision(h, placementId = placementId)

            updatePlacements(h, vardaClient)

            val result = getVardaPlacements(h)
            assertEquals(1, result.size)
            assertEquals(placementId, result.first().evakaPlacementId)
        }
    }

    @Test
    fun `a daycare placement is not sent when varda_unit has no OID`() {
        jdbi.handle { h ->
            val period = ClosedPeriod(LocalDate.of(2019, 8, 1), LocalDate.of(2020, 7, 31))
            insertVardaUnit(h = h, unitOid = null)
            val placementId = insertPlacement(h, testChild_1.id, period)
            insertTestVardaDecision(h, placementId = placementId)

            updatePlacements(h, vardaClient)

            val result = getVardaPlacements(h)
            assertEquals(0, result.size)
        }
    }
}

internal fun getVardaPlacements(h: Handle) = h.createQuery("SELECT * FROM varda_placement")
    .map(toVardaPlacementRow)
    .toList()

internal fun insertVardaUnit(h: Handle, unitId: UUID = testDaycare.id, unitOid: String? = "1.2.3") {
    h.transaction { t ->
        t
            .createUpdate(
                """
INSERT INTO varda_unit (evaka_daycare_id, varda_unit_id, created_at, uploaded_at)
VALUES (:evakaDaycareId, :vardaUnitId,  :createdAt, :uploadedAt)
                """.trimIndent()
            )
            .bind("evakaDaycareId", unitId)
            .bind("vardaUnitId", 1L)
            .bind("ophUnitOid", unitOid)
            .bind("createdAt", Instant.now())
            .bind("uploadedAt", Instant.now())
            .execute()

        t.createUpdate("UPDATE daycare SET oph_unit_oid = :unitOid WHERE daycare.id = :unitId")
            .bind("unitId", unitId)
            .bind("unitOid", unitOid)
            .execute()
    }
}

internal fun insertTestVardaDecision(h: Handle, decisionId: UUID? = null, placementId: UUID? = null): UUID {
    val id = UUID.randomUUID()
    insertVardaDecision(
        h,
        VardaDecisionTableRow(
            id = id,
            vardaDecisionId = 123L,
            evakaDecisionId = decisionId,
            evakaPlacementId = placementId,
            createdAt = Instant.now(),
            uploadedAt = Instant.now()
        )
    )
    return id
}

internal fun insertPlacement(
    h: Handle,
    childId: UUID,
    period: ClosedPeriod,
    type: PlacementType = DAYCARE,
    unitId: UUID = testDaycare.id
): UUID {
    return insertTestPlacement(
        h,
        childId = childId,
        type = type,
        startDate = period.start,
        endDate = period.end,
        unitId = unitId
    )
}

internal fun updatePlacement(h: Handle, id: UUID, updatedAt: Instant) {
    h.createUpdate("UPDATE placement SET updated = :updatedAt WHERE id = :id")
        .bind("id", id)
        .bind("updatedAt", updatedAt)
        .execute()
}