// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.decision

import fi.espoo.evaka.Audit
import fi.espoo.evaka.application.fetchApplicationDetails
import fi.espoo.evaka.pis.service.PersonService
import fi.espoo.evaka.shared.auth.AccessControlList
import fi.espoo.evaka.shared.auth.AclAuthorization
import fi.espoo.evaka.shared.auth.AuthenticatedUser
import fi.espoo.evaka.shared.auth.UserRole
import fi.espoo.evaka.shared.db.Database
import fi.espoo.evaka.shared.domain.Forbidden
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/decisions2")
class DecisionController(
    private val acl: AccessControlList,
    private val decisionService: DecisionService,
    private val decisionDraftService: DecisionDraftService,
    private val personService: PersonService
) {
    @GetMapping("/by-guardian")
    fun getDecisionsByGuardian(
        db: Database.Connection,
        user: AuthenticatedUser,
        @RequestParam("id") guardianId: UUID
    ): ResponseEntity<DecisionListResponse> {
        Audit.DecisionRead.log(targetId = guardianId)
        user.requireOneOfRoles(UserRole.ADMIN, UserRole.SERVICE_WORKER, UserRole.FINANCE_ADMIN, UserRole.UNIT_SUPERVISOR)
        val decisions = db.read { getDecisionsByGuardian(it.handle, guardianId, acl.getAuthorizedUnits(user)) }

        return ResponseEntity.ok(DecisionListResponse(withPublicDocumentUri(decisions)))
    }

    @GetMapping("/by-child")
    fun getDecisionsByChild(
        db: Database.Connection,
        user: AuthenticatedUser,
        @RequestParam("id") childId: UUID
    ): ResponseEntity<DecisionListResponse> {
        Audit.DecisionRead.log(targetId = childId)
        user.requireOneOfRoles(UserRole.ADMIN, UserRole.SERVICE_WORKER, UserRole.UNIT_SUPERVISOR)
        val decisions = db.read { getDecisionsByChild(it.handle, childId, acl.getAuthorizedUnits(user)) }

        return ResponseEntity.ok(DecisionListResponse(withPublicDocumentUri(decisions)))
    }

    @GetMapping("/by-application")
    fun getDecisionsByApplication(
        db: Database.Connection,
        user: AuthenticatedUser,
        @RequestParam("id") applicationId: UUID
    ): ResponseEntity<DecisionListResponse> {
        Audit.DecisionRead.log(targetId = applicationId)
        user.requireOneOfRoles(UserRole.ADMIN, UserRole.SERVICE_WORKER, UserRole.UNIT_SUPERVISOR)
        val decisions = db.read { getDecisionsByApplication(it.handle, applicationId, acl.getAuthorizedUnits(user)) }

        return ResponseEntity.ok(DecisionListResponse(withPublicDocumentUri(decisions)))
    }

    @GetMapping("/units")
    fun getDecisionUnits(db: Database.Connection, user: AuthenticatedUser): ResponseEntity<List<DecisionUnit>> {
        Audit.UnitRead.log()
        user.requireOneOfRoles(UserRole.ADMIN, UserRole.SERVICE_WORKER, UserRole.UNIT_SUPERVISOR, UserRole.FINANCE_ADMIN)
        val units = db.read { decisionDraftService.getDecisionUnits(it) }
        return ResponseEntity.ok(units)
    }

    @GetMapping("/{id}/download", produces = [MediaType.APPLICATION_PDF_VALUE])
    fun downloadDecisionPdf(
        db: Database.Connection,
        user: AuthenticatedUser,
        @PathVariable("id") decisionId: UUID
    ): ResponseEntity<ByteArray> {
        Audit.DecisionDownloadPdf.log(targetId = decisionId)

        val roles = acl.getRolesForDecision(user, decisionId)
        roles.requireOneOfRoles(UserRole.SERVICE_WORKER, UserRole.ADMIN, UserRole.UNIT_SUPERVISOR, UserRole.END_USER)

        return db.transaction { tx ->
            if (user.hasOneOfRoles(UserRole.END_USER)) {
                if (!getDecisionsByGuardian(tx.handle, user.id, AclAuthorization.All).any { it.id == decisionId }) {
                    throw Forbidden("Access denied")
                }
                return@transaction getDecisionPdf(tx, decisionId)
            }

            val decision = getDecision(tx.handle, decisionId) ?: error("Cannot find decision for decision id '$decisionId'")
            val application = fetchApplicationDetails(tx.handle, decision.applicationId)
                ?: error("Cannot find application for decision id '$decisionId'")

            val child = personService.getUpToDatePerson(
                tx,
                user,
                application.childId
            ) ?: error("Cannot find user for child id '${application.childId}'")

            val guardian = personService.getUpToDatePerson(
                tx,
                user,
                application.guardianId
            ) ?: error("Cannot find user for guardian id '${application.guardianId}'")

            if ((child.restrictedDetailsEnabled || guardian.restrictedDetailsEnabled) && !user.isAdmin())
                throw Forbidden("Päätöksen alaisella henkilöllä on voimassa turvakielto. Osoitetietojen suojaamiseksi vain pääkäyttäjä voi ladata tämän päätöksen.")

            getDecisionPdf(tx, decisionId)
        }
    }

    private fun getDecisionPdf(tx: Database.Read, decisionId: UUID): ResponseEntity<ByteArray> {
        return decisionService.getDecisionPdf(tx, decisionId)
            .let { document ->
                ResponseEntity.ok()
                    .header("Content-Disposition", "attachment;filename=${document.getName()}")
                    .body(document.getBytes())
            }
    }
}

fun withPublicDocumentUri(decisions: List<Decision>) = decisions.map { decision ->
    decision.copy(documentUri = "/api/internal/decisions2/${decision.id}/download") // do not expose direct s3 uri
}

data class DecisionListResponse(
    val decisions: List<Decision>
)
