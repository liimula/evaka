// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.decision

import fi.espoo.evaka.daycare.domain.ProviderType
import fi.espoo.evaka.shared.domain.ClosedPeriod
import java.time.LocalDate
import java.util.UUID

data class Decision(
    val id: UUID,
    val createdBy: String,
    val type: DecisionType,
    val startDate: LocalDate,
    val endDate: LocalDate,
    val unit: DecisionUnit,
    val applicationId: UUID,
    val childId: UUID,
    val childName: String,
    val documentUri: String?,
    val otherGuardianDocumentUri: String?,
    val decisionNumber: Long,
    val sentDate: LocalDate,
    val status: DecisionStatus,
    val requestedStartDate: LocalDate?,
    val resolved: LocalDate?
) {
    fun validRequestedStartDatePeriod() = ClosedPeriod(
        startDate,
        minOf(
            endDate,
            startDate.plusDays(
                when (this.type) {
                    DecisionType.CLUB -> 14
                    DecisionType.DAYCARE, DecisionType.DAYCARE_PART_TIME -> 14
                    DecisionType.PRESCHOOL -> 0
                    DecisionType.PRESCHOOL_DAYCARE -> 14
                    DecisionType.PREPARATORY_EDUCATION -> 0
                }
            )
        )
    )
}

data class DecisionUnit(
    val id: UUID,
    val name: String,
    val daycareDecisionName: String,
    val preschoolDecisionName: String,
    val manager: String?,
    val streetAddress: String,
    val postalCode: String,
    val postOffice: String,
    val decisionHandler: String,
    val decisionHandlerAddress: String,
    val providerType: ProviderType
)