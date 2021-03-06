// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.pis.dao

import fi.espoo.evaka.identity.ExternalIdentifier
import fi.espoo.evaka.pis.AbstractIntegrationTest
import fi.espoo.evaka.pis.createPartnership
import fi.espoo.evaka.pis.createPerson
import fi.espoo.evaka.pis.getPartnershipsForPerson
import fi.espoo.evaka.pis.service.PersonDTO
import fi.espoo.evaka.pis.service.PersonIdentityRequest
import fi.espoo.evaka.shared.db.handle
import fi.espoo.evaka.shared.db.transaction
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Test
import java.time.LocalDate

class PartnershipDAOIntegrationTest : AbstractIntegrationTest() {
    @Test
    fun `test creating partnership`() = jdbi.handle { h ->
        val person1 = testPerson1()
        val person2 = testPerson2()
        val startDate = LocalDate.now()
        val endDate = startDate.plusDays(100)
        val partnership = h.createPartnership(person1.id, person2.id, startDate, endDate)
        assertNotNull(partnership.id)
        assertEquals(2, partnership.partners.size)
        assertEquals(startDate, partnership.startDate)
        assertEquals(endDate, partnership.endDate)
    }

    @Test
    fun `test fetching partnerships by person`() = jdbi.handle { h ->
        val person1 = testPerson1()
        val person2 = testPerson2()
        val person3 = testPerson3()

        val partnership1 = h.createPartnership(person1.id, person2.id, LocalDate.now(), LocalDate.now().plusDays(200))
        val partnership2 = h.createPartnership(person2.id, person3.id, LocalDate.now().plusDays(300), LocalDate.now().plusDays(400))

        val person1Partnerships = h.getPartnershipsForPerson(person1.id)
        assertEquals(listOf(partnership1), person1Partnerships)

        val person2Partnerships = h.getPartnershipsForPerson(person2.id)
        assertEquals(listOf(partnership1, partnership2), person2Partnerships)

        val person3Partnerships = h.getPartnershipsForPerson(person3.id)
        assertEquals(listOf(partnership2), person3Partnerships)
    }

    @Test
    fun `test partnership without endDate`() = jdbi.handle { h ->
        val person1 = testPerson1()
        val person2 = testPerson2()
        val startDate = LocalDate.now()
        val partnership = h.createPartnership(person1.id, person2.id, startDate, endDate = null)
        assertNotNull(partnership.id)
        assertEquals(2, partnership.partners.size)
        assertEquals(startDate, partnership.startDate)
        assertEquals(null, partnership.endDate)

        val fetched = h.getPartnershipsForPerson(person1.id).first()
        assertEquals(partnership.id, fetched.id)
        assertEquals(2, fetched.partners.size)
        assertEquals(startDate, fetched.startDate)
        assertEquals(null, fetched.endDate)
    }

    private fun createPerson(ssn: String, firstName: String): PersonDTO {
        return jdbi.transaction {
            it.createPerson(
                PersonIdentityRequest(
                    identity = ExternalIdentifier.SSN.getInstance(ssn),
                    firstName = firstName,
                    lastName = "Meikäläinen",
                    email = "${firstName.toLowerCase()}.meikalainen@example.com",
                    language = "fi"
                )
            )
        }
    }

    private fun testPerson1() = createPerson("140881-172X", "Aku")
    private fun testPerson2() = createPerson("150786-1766", "Iines")
    private fun testPerson3() = createPerson("170679-601K", "Hannu")
}
