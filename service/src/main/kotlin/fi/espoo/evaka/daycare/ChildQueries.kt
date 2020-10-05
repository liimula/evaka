// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.daycare

import fi.espoo.evaka.daycare.service.Child
import org.jdbi.v3.core.Handle
import org.jdbi.v3.core.kotlin.mapTo
import java.util.UUID

fun Handle.getChild(id: UUID): Child? {
    // language=SQL
    val sql = "SELECT * FROM child WHERE id = :id"

    return createQuery(sql)
        .bind("id", id)
        .mapTo<Child>()
        .firstOrNull()
}

fun Handle.createChild(child: Child): Child {
    // language=SQL
    val sql =
        "INSERT INTO child (id, allergies, diet, additionalinfo) VALUES (:id, :allergies, :diet, :additionalInfo) RETURNING *"

    return createQuery(sql)
        .bind("id", child.id)
        .bind("allergies", child.additionalInformation.allergies)
        .bind("diet", child.additionalInformation.diet)
        .bind("additionalInfo", child.additionalInformation.additionalInfo)
        .mapTo<Child>()
        .first()
}

fun Handle.upsertChild(child: Child) {
    // language=SQL
    val sql =
        """
        INSERT INTO child (id, allergies, diet) VALUES (:id, :allergies, :diet) 
        ON CONFLICT (id) DO UPDATE SET allergies = :allergies, diet = :diet
        """.trimIndent()

    createUpdate(sql)
        .bind("id", child.id)
        .bind("allergies", child.additionalInformation.allergies)
        .bind("diet", child.additionalInformation.diet)
        .execute()
}

fun Handle.updateChild(child: Child) {
    // language=SQL
    val sql = "UPDATE child SET allergies = :allergies, diet = :diet, additionalinfo = :additionalInfo WHERE id = :id"

    createUpdate(sql)
        .bind("id", child.id)
        .bind("allergies", child.additionalInformation.allergies)
        .bind("diet", child.additionalInformation.diet)
        .bind("additionalInfo", child.additionalInformation.additionalInfo)
        .execute()
}