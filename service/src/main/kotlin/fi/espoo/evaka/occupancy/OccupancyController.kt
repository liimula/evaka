// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.occupancy

import fi.espoo.evaka.Audit
import fi.espoo.evaka.shared.auth.AccessControlList
import fi.espoo.evaka.shared.auth.AuthenticatedUser
import fi.espoo.evaka.shared.auth.UserRole
import fi.espoo.evaka.shared.db.Database
import fi.espoo.evaka.shared.db.getUUID
import fi.espoo.evaka.shared.domain.BadRequest
import fi.espoo.evaka.shared.domain.FiniteDateRange
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDate
import java.util.UUID

@RestController
@RequestMapping("/occupancy")
class OccupancyController(private val acl: AccessControlList) {
    @GetMapping("/by-unit/{unitId}")
    fun getOccupancyPeriods(
        db: Database.Connection,
        user: AuthenticatedUser,
        @PathVariable unitId: UUID,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) from: LocalDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) to: LocalDate,
        @RequestParam type: OccupancyType
    ): ResponseEntity<OccupancyResponse> {
        Audit.OccupancyRead.log(targetId = unitId)
        acl.getRolesForUnit(user, unitId)
            .requireOneOfRoles(UserRole.ADMIN, UserRole.SERVICE_WORKER, UserRole.FINANCE_ADMIN, UserRole.UNIT_SUPERVISOR)

        val occupancies = db.read { it.calculateOccupancyPeriods(unitId, FiniteDateRange(from, to), type) }

        val response = OccupancyResponse(
            occupancies = occupancies,
            max = occupancies.filter { it.percentage != null }.maxByOrNull { it.percentage!! },
            min = occupancies.filter { it.percentage != null }.minByOrNull { it.percentage!! }
        )
        return ResponseEntity.ok(response)
    }

    @GetMapping("/by-unit/{unitId}/groups")
    fun getOccupancyPeriodsOnGroups(
        db: Database.Connection,
        user: AuthenticatedUser,
        @PathVariable unitId: UUID,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) from: LocalDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) to: LocalDate,
        @RequestParam type: OccupancyType
    ): ResponseEntity<List<OccupancyResponseGroupLevel>> {
        Audit.OccupancyRead.log(targetId = unitId)
        acl.getRolesForUnit(user, unitId)
            .requireOneOfRoles(UserRole.ADMIN, UserRole.SERVICE_WORKER, UserRole.FINANCE_ADMIN, UserRole.UNIT_SUPERVISOR)

        val occupancies = db.read { it.calculateOccupancyPeriodsGroupLevel(unitId, FiniteDateRange(from, to), type) }

        val response = occupancies.groupBy({ it.groupId }) {
            OccupancyPeriod(it.period, it.sum, it.headcount, it.caretakers, it.percentage)
        }.entries.map { (key, value) ->
            OccupancyResponseGroupLevel(
                groupId = key,
                occupancies = OccupancyResponse(
                    occupancies = value,
                    max = value.filter { it.percentage != null }.maxByOrNull { it.percentage!! },
                    min = value.filter { it.percentage != null }.minByOrNull { it.percentage!! }
                )
            )
        }

        return ResponseEntity.ok(response)
    }
}

data class OccupancyResponseGroupLevel(
    val groupId: UUID,
    val occupancies: OccupancyResponse
)

data class OccupancyResponse(
    val occupancies: List<OccupancyPeriod>,
    val max: OccupancyPeriod?,
    val min: OccupancyPeriod?
)

/*
 * Series of occupancy rates in a given unit during given closed period
 *
 * The coefficient of a child is determined as a product of following values:
 * - age coefficient, children under 3 years old = 1.75, children at least 3 years old = 1.0
 * - service need coefficient, full time daycare / preschool = 1.0, part time daycare = 0.54, part time daycare with preschool = 0.5
 * - assistance need coefficient = X, or default = 1.0
 */
fun Database.Read.calculateOccupancyPeriods(
    unitId: UUID,
    period: FiniteDateRange,
    type: OccupancyType
): List<OccupancyPeriod> {
    if (period.start.plusYears(2) < period.end) {
        throw BadRequest("Date range ${period.start} - ${period.end} is too long. Maximum range is two years.")
    }

    val sql = getSql(
        type,
        singleUnit = true,
        includeGroups = false
    )

    return createQuery(sql)
        .bind("unitId", unitId)
        .bind("startDate", period.start)
        .bind("endDate", period.end)
        .map { rs, _ ->
            OccupancyPeriod(
                period = FiniteDateRange(
                    rs.getDate("period_start").toLocalDate(),
                    rs.getDate("period_end").toLocalDate()
                ),
                sum = rs.getDouble("sum"),
                headcount = rs.getInt("headcount"),
                percentage = rs.getBigDecimal("percentage")?.toDouble(),
                caretakers = rs.getBigDecimal("caretakers")?.toDouble()
            )
        }
        .list()
}

fun Database.Read.calculateOccupancyPeriodsGroupLevel(
    unitId: UUID,
    period: FiniteDateRange,
    type: OccupancyType
): List<OccupancyPeriodGroupLevel> {
    if (period.start.plusYears(2) < period.end) {
        throw BadRequest("Date range ${period.start} - ${period.end} is too long. Maximum range is two years.")
    }

    val sql = getSql(
        type,
        singleUnit = true,
        includeGroups = true
    )

    return createQuery(sql)
        .bind("unitId", unitId)
        .bind("startDate", period.start)
        .bind("endDate", period.end)
        .map { rs, _ ->
            OccupancyPeriodGroupLevel(
                groupId = rs.getUUID("group_id"),
                period = FiniteDateRange(
                    rs.getDate("period_start").toLocalDate(),
                    rs.getDate("period_end").toLocalDate()
                ),
                sum = rs.getDouble("sum"),
                headcount = rs.getInt("headcount"),
                percentage = rs.getBigDecimal("percentage")?.toDouble(),
                caretakers = rs.getBigDecimal("caretakers")?.toDouble()
            )
        }
        .list()
}
