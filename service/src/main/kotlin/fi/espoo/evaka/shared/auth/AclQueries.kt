// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.shared.auth

import org.jdbi.v3.core.Handle
import org.jdbi.v3.core.kotlin.mapTo
import org.jdbi.v3.core.mapper.Nested
import java.util.UUID

data class DaycareAclRow(
    @Nested
    val employee: DaycareAclRowEmployee,
    val role: UserRole
)

data class DaycareAclRowEmployee(val id: UUID, val firstName: String, val lastName: String, val email: String?)

fun Handle.getDaycareAclRows(daycareId: UUID): List<DaycareAclRow> = createQuery(
    // language=SQL
    """
SELECT id, first_name, last_name, email, role
FROM daycare_acl
JOIN employee e on daycare_acl.employee_id = e.id
WHERE daycare_id = :daycareId
    """.trimIndent()
)
    .bind("daycareId", daycareId)
    .mapTo<DaycareAclRow>()
    .toList()

fun Handle.insertDaycareAclRow(
    daycareId: UUID,
    employeeId: UUID,
    role: UserRole
) = createUpdate(
    // language=SQL
    """
INSERT INTO daycare_acl (daycare_id, employee_id, role)
VALUES (:daycareId, :employeeId, :role)
ON CONFLICT (daycare_id, employee_id) DO UPDATE SET role = excluded.role
    """.trimIndent()
)
    .bind("daycareId", daycareId)
    .bind("employeeId", employeeId)
    .bind("role", role)
    .execute()

fun Handle.deleteDaycareAclRow(
    daycareId: UUID,
    employeeId: UUID,
    role: UserRole
) = createUpdate(
    // language=SQL
    """
DELETE FROM daycare_acl
WHERE daycare_id = :daycareId
AND employee_id = :employeeId
AND role = :role
    """.trimIndent()
)
    .bind("daycareId", daycareId)
    .bind("employeeId", employeeId)
    .bind("role", role)
    .execute()
