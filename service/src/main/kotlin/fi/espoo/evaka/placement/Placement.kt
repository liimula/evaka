// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.placement

import java.time.LocalDate
import java.util.UUID

data class Placement(
    val id: UUID,
    val type: PlacementType,
    val childId: UUID,
    val unitId: UUID,
    val startDate: LocalDate,
    val endDate: LocalDate
)
