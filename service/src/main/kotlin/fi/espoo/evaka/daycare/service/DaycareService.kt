// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.daycare.service

import fi.espoo.evaka.daycare.createDaycareGroup
import fi.espoo.evaka.daycare.deleteDaycareGroup
import fi.espoo.evaka.daycare.getDaycareGroups
import fi.espoo.evaka.daycare.getGroupStats
import fi.espoo.evaka.daycare.getUnitStats
import fi.espoo.evaka.daycare.initCaretakers
import fi.espoo.evaka.daycare.isValidDaycareId
import fi.espoo.evaka.placement.getDaycareGroupPlacements
import fi.espoo.evaka.shared.db.Database
import fi.espoo.evaka.shared.db.psqlCause
import fi.espoo.evaka.shared.domain.Conflict
import fi.espoo.evaka.shared.domain.NotFound
import org.jdbi.v3.core.statement.UnableToExecuteStatementException
import org.postgresql.util.PSQLState
import org.springframework.stereotype.Service
import java.time.LocalDate
import java.util.UUID

@Service
class DaycareService {
    fun getDaycareCapacityStats(
        tx: Database.Read,
        daycareId: UUID,
        startDate: LocalDate,
        endDate: LocalDate
    ): DaycareCapacityStats {
        val unitStats = tx.handle.getUnitStats(daycareId, startDate, endDate)
        return DaycareCapacityStats(
            unitTotalCaretakers = unitStats,
            groupCaretakers = tx.handle.getGroupStats(daycareId, startDate, endDate)
        )
    }

    fun createGroup(
        tx: Database.Transaction,
        daycareId: UUID,
        name: String,
        startDate: LocalDate,
        initialCaretakers: Double
    ): DaycareGroup = tx.handle.createDaycareGroup(daycareId, name, startDate).also {
        tx.handle.initCaretakers(it.id, it.startDate, initialCaretakers)
    }

    fun deleteGroup(tx: Database.Transaction, daycareId: UUID, groupId: UUID) = try {
        val isEmpty = tx.handle.getDaycareGroupPlacements(
            daycareId = daycareId,
            groupId = groupId,
            startDate = null,
            endDate = null
        ).isEmpty()

        if (!isEmpty) throw Conflict("Cannot delete group which has children placed in it")

        tx.handle.deleteDaycareGroup(groupId)
    } catch (e: UnableToExecuteStatementException) {
        throw e.psqlCause()?.takeIf { it.sqlState == PSQLState.FOREIGN_KEY_VIOLATION.state }
            ?.let { Conflict("Cannot delete group which is still referred to from other data") }
            ?: e
    }

    fun getDaycareGroups(tx: Database.Read, daycareId: UUID, startDate: LocalDate?, endDate: LocalDate?): List<DaycareGroup> {
        if (!tx.handle.isValidDaycareId(daycareId)) throw NotFound("No daycare found with id $daycareId")

        return tx.handle.getDaycareGroups(daycareId, startDate, endDate)
    }
}

data class DaycareManager(
    val name: String,
    val email: String,
    val phone: String
)

data class DaycareGroup(
    val id: UUID,
    val daycareId: UUID,
    val name: String,
    val startDate: LocalDate,
    val endDate: LocalDate?,
    val deletable: Boolean
)

data class DaycareCapacityStats(
    val unitTotalCaretakers: Stats,
    val groupCaretakers: Map<UUID, Stats>
)

data class Stats(
    val minimum: Double,
    val maximum: Double
)
